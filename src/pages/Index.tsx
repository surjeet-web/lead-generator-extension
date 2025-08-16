import { LeadGenerator } from "@/components/LeadGenerator";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  return (
    <div className="p-4 sm:p-8 bg-background text-foreground min-h-screen">
      <main className="container mx-auto">
        <LeadGenerator />
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Index;