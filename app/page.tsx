import Link from "next/link";
import StudentInfoPage from "./student-info";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="bg-black min-h-screen h-fit">
      <StudentInfoPage />
      <div className="pt-1 pb-8 text-center w-full container px-8">
        <Link href="/pdf-viewer">
          <Button variant="secondary" className="w-full">
            Generate PDF
          </Button>
        </Link>
      </div>
    </div>
  );
}
