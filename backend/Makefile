.PHONY: uuid

# Print a ready-to-paste test_id marker and copy it to the clipboard (macOS pbcopy, if available)
uuid:
	@marker='@pytest.mark.test_id("'$$(python3 -c 'import uuid; print(uuid.uuid4())')'")'; \
	echo "$$marker"; \
	if command -v pbcopy >/dev/null; then printf '%s' "$$marker" | pbcopy && echo "(copied to clipboard)"; fi
