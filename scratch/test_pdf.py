import io
from PIL import Image

img = Image.new('RGBA', (1000, 500), color = 'blue')
buffer = io.BytesIO()
img.save(buffer, format='PDF')
print("Successfully saved RGBA as PDF!")
