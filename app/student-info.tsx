"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const MonacoEditor = dynamic(() => import("./components/MonacoEditor"), {
  ssr: false,
});

interface StudentInfo {
  studentName: string;
  enrollmentNumber: string;
  subjectName: string;
  subjectCode: string;
  practicalNumber: string;
  practicalName: string;
  practicalDescription: string;
  practicalCode: string;
  font: "Helvetica" | "Times New Roman";
}

const initialInfo: StudentInfo = {
  studentName: "",
  enrollmentNumber: "",
  subjectName: "",
  subjectCode: "",
  practicalNumber: "",
  practicalName: "",
  practicalDescription: "",
  practicalCode: "",
  font: "Helvetica",
};

export default function StudentInfoPage() {
  const [info, setInfo] = useState<StudentInfo>(initialInfo);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log(isDialogOpen, "isDialogOpen");
  }, [isDialogOpen]);

  useEffect(() => {
    const storedInfo = localStorage.getItem("studentInfo");
    if (storedInfo) {
      setInfo(JSON.parse(storedInfo));
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setInfo((prev) => {
      const newInfo = {
        ...prev,
        [name]: value.trim() === "" ? undefined : value,
      };
      localStorage.setItem("studentInfo", JSON.stringify(newInfo));
      return newInfo;
    });
  };

  const handleCodeChange = (value: string) => {
    setInfo((prev) => {
      const newInfo = { ...prev, practicalCode: value };
      localStorage.setItem("studentInfo", JSON.stringify(newInfo));
      return newInfo;
    });
  };

  const handleFontChange = (value: "Helvetica" | "Times New Roman") => {
    setInfo((prev) => {
      const newInfo = { ...prev, font: value };
      localStorage.setItem("studentInfo", JSON.stringify(newInfo));
      return newInfo;
    });
  };

  const handleGenerateCode = async () => {
    if (!prompt.trim()) {
      toast({ description: "Prompt cannot be empty.", variant: "error" });
      return;
    }

    setIsLoading(true);
    try {
      // Construct the payload for the API call
      const payload = {
        prompt, // The prompt provided by the user
        messages: [], // Add any messages you want the API to use as context
        stream: false, // Set to `true` if you want a streaming response
        max_tokens: 256, // You can adjust this value as needed
        temperature: 0.6, // You can adjust this value as needed
      };

      // Make the API call
      const response = await fetch(
        "https://llm.aryanranderiya1478.workers.dev",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Failed to fetch AI-generated code.");

      const data = await response.json();

      // Check if the response contains the generated code
      if (!data?.choices?.[0]?.message?.content) {
        throw new Error("No code returned from the API.");
      }

      // Update the state with the generated code
      handleCodeChange(data.choices[0].message.content);
      toast({
        description: "Code generated successfully.",
        variant: "success",
      });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        description: error?.message || "An error occurred.",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="p-8 w-screen text-white">
        <h1 className="text-2xl font-bold mb-4">
          Student Practical Information
        </h1>
        <form className="space-y-4 container">
          <div className="flex justify-evenly gap-5">
            <div className="w-full">
              <Label className="font-bold text-lg" htmlFor="studentName">
                Student Name
              </Label>
              <Input
                id="studentName"
                name="studentName"
                value={info.studentName}
                onChange={handleChange}
                className="bg-zinc-800 !border-zinc-600"
              />
            </div>
            <div className="w-full">
              <Label className="font-bold text-lg" htmlFor="enrollmentNumber">
                Enrollment Number
              </Label>
              <Input
                id="enrollmentNumber"
                name="enrollmentNumber"
                value={info.enrollmentNumber}
                onChange={handleChange}
                className="bg-zinc-800 !border-zinc-600"
              />
            </div>
          </div>
          <div className="flex justify-evenly gap-5">
            <div className="w-full">
              <Label className="font-bold text-lg" htmlFor="subjectName">
                Subject Name
              </Label>
              <Input
                id="subjectName"
                name="subjectName"
                value={info.subjectName}
                onChange={handleChange}
                className="bg-zinc-800 !border-zinc-600"
              />
            </div>
            <div className="w-full">
              <Label className="font-bold text-lg" htmlFor="subjectCode">
                Subject Code
              </Label>
              <Input
                id="subjectCode"
                name="subjectCode"
                value={info.subjectCode}
                onChange={handleChange}
                className="bg-zinc-800 !border-zinc-600"
              />
            </div>
          </div>
          <div className="flex justify-evenly gap-5">
            <div className="w-full">
              <Label className="font-bold text-lg" htmlFor="practicalName">
                Practical Name
              </Label>
              <Input
                id="practicalName"
                name="practicalName"
                value={info.practicalName}
                onChange={handleChange}
                className="bg-zinc-800 !border-zinc-600"
              />
            </div>
            <div className="w-full">
              <Label className="font-bold text-lg" htmlFor="practicalNumber">
                Practical Number
              </Label>
              <Input
                id="practicalNumber"
                name="practicalNumber"
                value={info.practicalNumber}
                onChange={handleChange}
                className="bg-zinc-800 !border-zinc-600"
              />
            </div>
          </div>

          <div>
            <Label className="font-bold text-lg" htmlFor="practicalDescription">
              Practical Description
            </Label>
            <Textarea
              id="practicalDescription"
              name="practicalDescription"
              value={info.practicalDescription}
              onChange={handleChange}
              className="bg-zinc-800 !border-zinc-600"
            />
          </div>
          <div className="flex flex-col gap-3">
            <Label className="font-bold text-lg" htmlFor="practicalCode">
              Practical Code
            </Label>

            <Button
              type="button"
              size={"sm"}
              className="bg-blue-600 hover:bg-blue-700 w-fit"
              onClick={() => setIsDialogOpen(true)}
            >
              Generate Code with AI
            </Button>

            <MonacoEditor
              value={info.practicalCode}
              onChange={handleCodeChange}
              language="javascript"
            />
          </div>
          <div>
            <Label className="font-bold text-lg" htmlFor="font">
              Font
            </Label>
            <Select onValueChange={handleFontChange} value={info.font}>
              <SelectTrigger className="bg-zinc-800 !border-zinc-600">
                <SelectValue placeholder="Select a font" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value="Helvetica"
                  className="bg-zinc-800 hover:!bg-zinc-300 !border-zinc-600 text-white"
                >
                  Helvetica
                </SelectItem>
                <SelectItem
                  value="Times New Roman"
                  className="bg-zinc-800 hover:!bg-zinc-300 !border-zinc-600 text-white"
                >
                  Times New Roman
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-900 text-white outline-none border-zinc-700 border-2">
          <DialogHeader>
            <DialogTitle>Generate Code with AI</DialogTitle>
          </DialogHeader>
          <div>
            <Label className="font-bold text-lg" htmlFor="aiPrompt">
              Enter your prompt
            </Label>
            <Textarea
              id="aiPrompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the code you need..."
              className="bg-zinc-800 !border-zinc-600"
            />
          </div>
          <DialogFooter>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleGenerateCode}
              type="button"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span>Generating...</span>
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                </div>
              ) : (
                "Generate Code"
              )}
            </Button>
            <Button
              className="bg-gray-600 hover:bg-gray-700"
              type="button"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
