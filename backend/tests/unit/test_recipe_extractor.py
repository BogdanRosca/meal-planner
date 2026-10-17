"""
Unit tests for the LLM recipe extractor: prompt input, Anthropic call handling and draft normalisation
"""
import json
from unittest.mock import MagicMock, patch

import anthropic
import httpx
import pytest

from app.services import recipe_extractor
from app.services.recipe_extractor import (
    ExtractedIngredient, ExtractionError, ExtractionTimeoutError, NotARecipeError, RecipeExtraction,
    TRANSCRIPT_MAX_CHARS, build_draft, call_llm, clean_video_title, normalize_ingredients,
)

METADATA = {
    "title": "BEST EVER Pasta!!",
    "description": "200g spaghetti",
    "channel": "Chef",
    "duration": "PT10M",
    "language": "it",
    "thumbnail_url": "https://i.ytimg.com/vi/x/maxresdefault.jpg",
}

EXTRACTION_JSON = {
    "is_recipe": True,
    "name": "Spaghetti Aglio e Olio",
    "category": "dinner",
    "category_is_guess": False,
    "main_ingredients": [{"name": "spaghetti", "quantity": 200, "unit": "g"}],
    "common_ingredients": ["salt"],
    "steps": ["Boil pasta", "Toss with garlic oil"],
    "prep_time_minutes": 20,
    "prep_time_is_estimate": False,
    "portions": 2,
    "portions_is_estimate": False,
}


def _extraction(**overrides):
    return RecipeExtraction(**{**EXTRACTION_JSON, **overrides})


def _response(text=None, stop_reason="end_turn"):
    content = [MagicMock(type="thinking")]
    if text is not None:
        content.append(MagicMock(type="text", text=text))
    return MagicMock(stop_reason=stop_reason, content=content)


class TestCleanVideoTitle:
    @pytest.mark.parametrize("title, expected", [
        ("🔥 BEST EVER Chicken Curry!! | Easy Weeknight Dinner #shorts", "Chicken Curry"),
        ("The PERFECT Lasagna (Gordon Ramsay)", "Lasagna"),
        ("CREAMY TOMATO SOUP", "Creamy Tomato Soup"),
        ("Banana Bread - Tasty", "Banana Bread"),
        ("", ""),
    ])
    def test_cleans_titles(self, title, expected):
        assert clean_video_title(title) == expected

    def test_truncates_to_name_limit(self):
        assert len(clean_video_title("a" * 400)) == 255


class TestNormalizeIngredients:
    def test_converts_units_and_rounds(self):
        main, moved, guessed = normalize_ingredients([
            ExtractedIngredient(name="butter", quantity=4, unit="oz"),
            ExtractedIngredient(name="vanilla", quantity=2, unit="tsp"),
            ExtractedIngredient(name="flour", quantity=1, unit="lb"),
            ExtractedIngredient(name="milk", quantity=1, unit="fl oz"),
            ExtractedIngredient(name="garlic", quantity=3, unit="Cloves"),
            ExtractedIngredient(name="stock", quantity=0.5, unit="l"),
        ])

        assert main == [
            {"name": "butter", "quantity": 113.4, "unit": "g"},
            {"name": "vanilla", "quantity": 0.67, "unit": "tbsp"},
            {"name": "flour", "quantity": 453.59, "unit": "g"},
            {"name": "milk", "quantity": 29.57, "unit": "ml"},
            {"name": "garlic", "quantity": 3, "unit": "pcs"},
            {"name": "stock", "quantity": 500, "unit": "ml"},
        ]
        assert moved == []
        assert guessed is False

    def test_moves_unquantified_items_and_flags_unknown_units(self):
        main, moved, guessed = normalize_ingredients([
            ExtractedIngredient(name="saffron", quantity=0, unit=""),
            ExtractedIngredient(name="  ", quantity=1, unit="g"),
            ExtractedIngredient(name="basil", quantity=1, unit="handful"),
        ])

        assert main == [{"name": "basil", "quantity": 1, "unit": "pcs"}]
        assert moved == ["saffron"]
        assert guessed is True


class TestBuildDraft:
    def test_maps_a_complete_extraction_without_flags(self):
        draft, flags = build_draft(_extraction(), METADATA)

        assert draft == {
            "name": "Spaghetti Aglio e Olio",
            "category": "dinner",
            "main_ingredients": [{"name": "spaghetti", "quantity": 200, "unit": "g"}],
            "common_ingredients": ["salt"],
            "instructions": "1. Boil pasta\n2. Toss with garlic oil",
            "prep_time": 20,
            "portions": 2,
            "foto_url": METADATA["thumbnail_url"],
        }
        assert flags == {}

    def test_not_a_recipe_raises(self):
        with pytest.raises(NotARecipeError):
            build_draft(_extraction(is_recipe=False), METADATA)

    def test_flags_guesses_and_missing_values(self):
        draft, flags = build_draft(_extraction(
            name=None,
            category="brunch",
            main_ingredients=[],
            steps=[" "],
            prep_time_minutes=0,
            portions=None,
        ), {**METADATA, "thumbnail_url": None})

        assert draft["name"] == "Pasta"
        assert draft["category"] == "dinner"
        assert draft["instructions"] is None
        assert flags == {
            "name": "estimated",
            "category": "estimated",
            "main_ingredients": "missing",
            "instructions": "missing",
            "prep_time": "missing",
            "portions": "missing",
            "foto_url": "missing",
        }

    def test_flags_llm_estimates(self):
        _, flags = build_draft(_extraction(
            category_is_guess=True,
            prep_time_is_estimate=True,
            portions_is_estimate=True,
            main_ingredients=[{"name": "basil", "quantity": 1, "unit": "bunch"}],
        ), METADATA)

        assert flags == {
            "category": "estimated",
            "main_ingredients": "estimated",
            "prep_time": "estimated",
            "portions": "estimated",
        }

    def test_name_missing_when_no_title_either(self):
        draft, flags = build_draft(_extraction(name=""), {**METADATA, "title": "🍝🍝"})

        assert draft["name"] is None
        assert flags["name"] == "missing"

    def test_deduplicates_common_ingredients(self):
        draft, _ = build_draft(_extraction(
            common_ingredients=["Salt", "salt ", "pepper"],
            main_ingredients=[{"name": "pepper", "quantity": 0, "unit": ""},
                              {"name": "spaghetti", "quantity": 200, "unit": "g"}],
        ), METADATA)

        assert draft["common_ingredients"] == ["Salt", "pepper"]


class TestBuildUserMessage:
    def test_includes_platform_metadata_and_transcript(self):
        message = recipe_extractor._build_user_message(METADATA, "Boil the pasta.", "instagram")

        assert "<platform>instagram</platform>" in message
        assert "<video_title>BEST EVER Pasta!!</video_title>" in message
        assert "<audio_language>it</audio_language>" in message
        assert "Boil the pasta." in message

    def test_truncates_long_transcripts(self):
        message = recipe_extractor._build_user_message(METADATA, "x" * (TRANSCRIPT_MAX_CHARS + 50), "youtube")

        assert "x" * TRANSCRIPT_MAX_CHARS + " [transcript truncated]" in message
        assert "x" * (TRANSCRIPT_MAX_CHARS + 1) not in message

    def test_explains_missing_transcript(self):
        message = recipe_extractor._build_user_message({}, None, "youtube")

        assert "no transcript available" in message
        assert "<video_duration>unknown</video_duration>" in message


@patch("app.services.recipe_extractor.anthropic.Anthropic")
class TestCallLlm:
    def test_returns_validated_extraction(self, mock_client_class):
        create = mock_client_class.return_value.beta.messages.create
        create.return_value = _response(json.dumps(EXTRACTION_JSON))

        result = call_llm(METADATA, "transcript", "key", "claude-haiku-5-5", 20, "youtube")

        assert result.name == "Spaghetti Aglio e Olio"
        mock_client_class.assert_called_once_with(api_key="key", timeout=20, max_retries=0)
        kwargs = create.call_args.kwargs
        assert kwargs["model"] == "claude-haiku-5-5"
        assert kwargs["output_config"]["effort"] == "low"
        assert kwargs["output_config"]["format"]["type"] == "json_schema"
        assert "fallbacks" not in kwargs

    def test_enables_refusal_fallback_on_supported_models(self, mock_client_class):
        create = mock_client_class.return_value.beta.messages.create
        create.return_value = _response(json.dumps(EXTRACTION_JSON))

        call_llm(METADATA, None, "key", "claude-sonnet-5-5", 20)

        assert create.call_args.kwargs["fallbacks"] == "default"
        assert create.call_args.kwargs["betas"] == [recipe_extractor.FALLBACK_BETA]

    def test_timeout_raises_extraction_timeout(self, mock_client_class):
        request = httpx.Request("POST", "https://api.anthropic.com/v1/messages")
        mock_client_class.return_value.beta.messages.create.side_effect = anthropic.APITimeoutError(request)

        with pytest.raises(ExtractionTimeoutError):
            call_llm(METADATA, None, "key", "claude-haiku-5-5", 20)

    def test_api_error_raises_extraction_error(self, mock_client_class):
        request = httpx.Request("POST", "https://api.anthropic.com/v1/messages")
        mock_client_class.return_value.beta.messages.create.side_effect = anthropic.APIConnectionError(request=request)

        with pytest.raises(ExtractionError) as error:
            call_llm(METADATA, None, "key", "claude-haiku-5-5", 20)
        assert not isinstance(error.value, ExtractionTimeoutError)

    @pytest.mark.parametrize("response", [
        _response(json.dumps(EXTRACTION_JSON), stop_reason="refusal"),
        _response(json.dumps(EXTRACTION_JSON), stop_reason="max_tokens"),
        _response(None),
        _response("not json"),
        _response(json.dumps({"is_recipe": True})),
    ])
    def test_unusable_output_raises_extraction_error(self, mock_client_class, response):
        mock_client_class.return_value.beta.messages.create.return_value = response

        with pytest.raises(ExtractionError):
            call_llm(METADATA, None, "key", "claude-haiku-5-5", 20)
