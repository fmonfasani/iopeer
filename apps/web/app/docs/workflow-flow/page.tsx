import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";

export default function WorkflowFlowPage() {
  const filePath = path.join(process.cwd(), "docs", "workflow-flow.md");
  const content = fs.readFileSync(filePath, "utf8");
  return (
    <main className="prose mx-auto p-6">
      <h1>📘 IOpeer Workflow Flow</h1>
      <ReactMarkdown>{content}</ReactMarkdown>
    </main>
  );
}
