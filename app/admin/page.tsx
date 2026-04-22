import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <Card>
        <CardHeader>
          <CardTitle>Admin Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Use the main dashboard admin panel to edit the hidden typography system prompt in context of project prompts.
          </p>
          <Link href="/" className="text-primary underline">
            Back to workspace
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
