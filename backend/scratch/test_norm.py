import unicodedata

# Using \U for 32-bit unicode
text = "\U0001d436\U0001d443\U0001d43c \U0001d453\U0001d45c\U0001d45f \U0001d452\U0001d460\U0001d456\U0001d45f\U0001d452\U0001d451"
normalized = unicodedata.normalize("NFKC", text)
print(f"Normalized: {normalized}")
