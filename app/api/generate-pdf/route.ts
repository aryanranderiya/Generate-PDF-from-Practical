import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// List of popular Python packages to pre-install
const POPULAR_PACKAGES = [
  "numpy",
  "pandas",
  "requests",
  "matplotlib",
  "scikit-learn",
  "tensorflow",
  "torch",
  "seaborn",
  "plotly",
  "scipy",
  "requests",
  "beautifulsoup4",
  "opencv-python",
  "pillow",
  "nltk",
];

async function setupPythonEnv() {
  try {
    // Use a simpler path in the OS temp directory
    const tempBase = process.env.TEMP || process.env.TMP || "/tmp";
    const envPath = path.join(tempBase, "py_env_practical");

    const envPythonPath =
      process.platform === "win32"
        ? path.join(envPath, "Scripts", "python.exe") // Explicitly add .exe for Windows
        : path.join(envPath, "bin", "python");

    // Check if environment already exists and is working
    if (fs.existsSync(envPythonPath)) {
      try {
        await execAsync(`"${envPythonPath}" -c "print('test')"`, {
          timeout: 5000,
        });
        console.log("Existing Python environment is working");
        return envPythonPath;
      } catch (e) {
        console.log("Existing environment not working, creating new one");
        // If test fails, we'll recreate the environment
        try {
          await execAsync(`rmdir /s /q "${envPath}"`, { shell: true });
        } catch (e) {
          // Ignore deletion errors
        }
      }
    }

    // Create new environment
    console.log("Creating Python virtual environment...");
    await execAsync(`python -m venv "${envPath}"`, { shell: true });

    // Install required packages
    const pipPath =
      process.platform === "win32"
        ? path.join(envPath, "Scripts", "pip.exe")
        : path.join(envPath, "bin", "pip");

    console.log("Installing packages...");
    // Install packages one by one to handle failures better
    for (const pkg of POPULAR_PACKAGES) {
      try {
        await execAsync(`"${pipPath}" install ${pkg}`, {
          shell: true,
          timeout: 300000, // 5 minute timeout per package
        });
        console.log(`Installed ${pkg}`);
      } catch (e) {
        console.error(`Failed to install ${pkg}:`, e);
        // Continue with other packages even if one fails
      }
    }

    return envPythonPath;
  } catch (error) {
    console.error("Error setting up Python environment:", error);
    // Fall back to system Python if virtual env fails
    return "python";
  }
}

// Function to execute Python code with matplotlib support
async function executePythonCode(
  code: string
): Promise<{ output: string; error: string; imagePaths: string[] }> {
  try {
    const pythonPath = await setupPythonEnv();

    // Use OS temp directory instead of current directory
    const tempDir = path.join(
      process.env.TEMP || process.env.TMP || "/tmp",
      "py_practical_temp"
    );
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFile = path.join(tempDir, `temp_${Date.now()}.py`);
    const wrapperCode = `
import sys
import io
import contextlib

# Wrap in try-except to catch import errors
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import numpy as np
    PLOTTING_AVAILABLE = True
except ImportError:
    PLOTTING_AVAILABLE = False
    print("Warning: Plotting libraries not available")

# Capture output
output = io.StringIO()
with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
    try:
        exec("""
${code.replace(/"/g, '\\"')}
        """)
        
        # Save plots only if matplotlib is available
        if PLOTTING_AVAILABLE and 'plt' in locals():
            if plt.get_fignums():
                for i, fig in enumerate(plt.get_fignums()):
                    plt.figure(fig)
                    plt.savefig(f'${tempDir.replace(
                      /\\/g,
                      "\\\\"
                    )}/plot_{i}.png')
                    plt.close(fig)
    except Exception as e:
        print(f"Error: {str(e)}")

print(output.getvalue())
`;

    fs.writeFileSync(tempFile, wrapperCode);

    // Execute with increased timeout and shell option
    const { stdout, stderr } = await execAsync(
      `"${pythonPath}" "${tempFile}"`,
      {
        shell: true,
        timeout: 30000, // 30 second timeout
      }
    );

    // Get any generated plot images
    const imagePaths = fs.existsSync(tempDir)
      ? fs
          .readdirSync(tempDir)
          .filter((file) => file.startsWith("plot_") && file.endsWith(".png"))
          .map((file) => path.join(tempDir, file))
      : [];

    // Clean up
    try {
      fs.unlinkSync(tempFile);
    } catch (e) {
      // Ignore cleanup errors
    }

    return {
      output: stdout,
      error: stderr,
      imagePaths,
    };
  } catch (error: any) {
    return {
      output: "",
      error: error.message || "An error occurred while executing the code",
      imagePaths: [],
    };
  }
}

function ensureHelveticaAFM() {
  const sourcePath = path.resolve("node_modules/pdfkit/js/data/Helvetica.afm");
  const destDir = path.resolve(".next/server/vendor-chunks/data");
  const destPath = path.join(destDir, "Helvetica.afm");

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(sourcePath, destPath);
  }
}

const addPageBorder = (doc) => {
  const margin = 15; // Border margin
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Set line width and color
  doc.lineWidth(3);
  doc.strokeColor("black"); // Set the color to black

  // doc.rect(x, y, width, height)
  // Draw a rectangle as the border (exclude margins from the content area)
  doc
    .rect(margin, margin * 2, pageWidth - margin * 2, pageHeight - margin * 4)
    .stroke();
};

export async function POST(req: NextRequest) {
  ensureHelveticaAFM();
  const data = await req.json();
  const isHelvetica = data.font === "Helvetica";

  // Execute Python code and capture output
  const { output, error, imagePaths } = await executePythonCode(
    data.practicalCode
  );

  // Path to the custom font
  const helveticaPath = path.join(
    process.cwd(),
    "public",
    "fonts",
    "Helvetica.ttf"
  );
  const helveticaBoldPath = path.join(
    process.cwd(),
    "public",
    "fonts",
    "Helvetica-Bold.ttf"
  );
  const timesPath = path.join(process.cwd(), "public", "fonts", "times.ttf");
  const timesBoldPath = path.join(
    process.cwd(),
    "public",
    "fonts",
    "timesbd.ttf"
  );
  const courierPath = path.join(
    process.cwd(),
    "public",
    "fonts",
    "Courier.ttf"
  );

  // Create a PDF document
  const doc = new PDFDocument();
  let buffers: Buffer[] = [];
  doc.on("data", buffers.push.bind(buffers));

  // Register and use the custom font
  doc.registerFont("Helvetica", helveticaPath);
  doc.registerFont("HelveticaBold", helveticaBoldPath);
  doc.registerFont("Courier", courierPath);
  doc.registerFont("Times", timesPath);
  doc.registerFont("TimesBold", timesBoldPath);
  doc.font(isHelvetica ? "Helvetica" : "Times");

  // Page number tracker
  let pageNumber = 1;

  // Track if we're in the code section
  let isInCodeSection = false;

  // Function to add footer text on every page
  const addFooter = () => {
    doc.font(isHelvetica ? "Helvetica" : "Times");
    doc.fontSize(10);
    const bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    const pageWidth = doc.page.width;
    const studentName = data.studentName;
    const enrollmentNumber = data.enrollmentNumber;
    const pageText = `Page ${pageNumber}`;

    // Left-aligned: Student Name
    doc.text(studentName, 50, doc.page.height - 20);

    // Center-aligned: Enrollment Number
    doc.text(
      enrollmentNumber,
      pageWidth / 2 - doc.widthOfString(enrollmentNumber) / 2,
      doc.page.height - 20
    );

    // Right-aligned: Page Number
    doc.text(
      pageText,
      pageWidth - 50 - doc.widthOfString(pageText),
      doc.page.height - 20,
      { lineBreak: false }
    );

    // Reset text writer position
    doc.text("", 50, 50);
    doc.page.margins.bottom = bottom;

    // Restore the correct font based on section
    if (isInCodeSection) {
      doc.font("Courier").fontSize(12);
    } else {
      doc.fontSize(14);
    }
  };

  const addHeader = () => {
    const currentFont = doc._font.name; // Store current font
    doc.font(isHelvetica ? "Helvetica" : "Times");
    doc.fontSize(10);
    const top = 10;
    const pageWidth = doc.page.width;
    const leftPosition = 50;
    doc.text(data.subjectName, leftPosition, top, { lineBreak: false });

    if (data.subjectCode) {
      const subjectCodeWidth = doc.widthOfString(data.subjectCode);
      const rightPosition = pageWidth - 50 - subjectCodeWidth;
      doc.text(data.subjectCode, rightPosition, top, { lineBreak: false });
    }

    // Restore the previous font
    doc.font(currentFont);
  };

  addHeader();
  addPageBorder(doc);

  doc.on("pageAdded", () => {
    pageNumber++;
    addHeader();
    addFooter();
    addPageBorder(doc);
  });

  addFooter();
  doc.moveDown();
  doc.font(isHelvetica ? "HelveticaBold" : "TimesBold");

  doc
    .fontSize(20)
    .text(`Practical - ${data.practicalNumber}`, { align: "center" });
  doc.fontSize(18).text(`${data.practicalName}`, { align: "center" });
  doc.moveDown();
  doc.font(isHelvetica ? "Helvetica" : "Times");

  if (data.practicalDescription)
    doc.fontSize(12).text(data.practicalDescription);

  doc.moveDown();
  doc.fontSize(16).font(isHelvetica ? "HelveticaBold" : "TimesBold");
  doc.text("Code:");
  doc.moveDown();

  // Set code section flag to true
  isInCodeSection = true;
  doc.font("Courier");
  doc.fontSize(12);

  // Add the code
  doc.text(data.practicalCode);

  // Add the output section
  doc.moveDown();

  if (output) {
    doc.font(isHelvetica ? "HelveticaBold" : "TimesBold");
    doc.moveDown();
    doc.fontSize(16).text("Output:");
    doc.moveDown();
    doc.font("Courier");
    doc.text(output);
    doc.font(isHelvetica ? "Helvetica" : "Times");
  }

  if (error) {
    doc.moveDown();
    doc.fillColor("red");
    doc.text("Errors:");
    doc.text(error);
    doc.fillColor("black");
  }

  // Add any generated plots
  if (imagePaths.length > 0) {
    doc.moveDown();
    doc.font(isHelvetica ? "HelveticaBold" : "TimesBold");
    doc.text("Generated Plots:");
    doc.moveDown();

    for (const imagePath of imagePaths) {
      doc.image(imagePath, {
        fit: [500, 400],
        align: "center",
      });
      doc.moveDown();

      // Clean up the plot image
      fs.unlinkSync(imagePath);
    }
  }

  // Reset code section flag
  isInCodeSection = false;
  doc.font(isHelvetica ? "Helvetica" : "Times");

  addFooter();

  doc.end();

  return new Promise((resolve) => {
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);

      const pdfFileName = `${data.studentName.replace(/ /g, "_")}_${
        data.subjectName
      }_Practical_${data.practicalNumber}.pdf`;

      resolve(
        new NextResponse(pdfData, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=${pdfFileName}`,
          },
        })
      );
    });
  });
}
