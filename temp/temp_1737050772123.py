from PIL import Image
import numpy as np
import matplotlib.pyplot as plt

if __name__ == "__main__":
    # 1. Read an image
    img = Image.open("./aryanranderiya.png")
    img.show()

    # 2. Display image properties such as format, size etc
    print("Image Size:", img.size)
    print("Image Format:", img.format)
    print("Image Mode:", img.mode)

    # 3. Image Resize
    new_width = 500
    new_height = 500
    resized_img = img.resize((new_width, new_height))
    resized_img.show()

    # 4. Image Thumbnail
    thumbnail_size = (100, 100)
    img.thumbnail(thumbnail_size)
    img.show()

    # 5. Image Crop
    left = 100
    upper = 100
    right = 400
    lower = 400
    cropped_img = img.crop((left, upper, right, lower))
    cropped_img.show()

    # 6. Image Transpose with different parameters
    transpose_method = Image.FLIP_LEFT_RIGHT
    transposed_img = img.transpose(transpose_method)
    transposed_img.show()

    # 7. Image Rotation
    angle = 45
    rotated_img = img.rotate(angle)
    rotated_img.show()

    # 8. Save an image
    img.save("./saved_image.png")

    # 9. Display images in plot
    plt.imshow(img)
    plt.show()

    # 10. Creating images using NumPy arrays
    array = np.zeros((500, 500, 3), dtype=np.uint8)
    array[:, :, 0] = 255  # Set red channel to 255
    array[:, :, 1] = 128  # Set green channel to 128
    array[:, :, 2] = 0  # Set blue channel to 0
    img_from_array = Image.fromarray(array)
    img_from_array.show()
