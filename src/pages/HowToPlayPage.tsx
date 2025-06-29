import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { LESSONS, Lesson } from "@/tutorial/lessons";
import TutorialBoard from "@/tutorial/TutorialBoard";

const HowToPlayPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const lesson: Lesson = LESSONS[step];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted">
      <header className="p-4 border-b flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}> <ArrowLeft className="h-5 w-5" /> </Button>
        <h1 className="text-xl font-bold ml-2">How to Play</h1>
      </header>

      <main className="flex-1 p-6 max-w-3xl mx-auto w-full flex flex-col items-center space-y-6">
        <h2 className="text-2xl font-semibold">{lesson.title}</h2>
        <p className="text-muted-foreground text-center max-w-prose">{lesson.description}</p>
        <TutorialBoard lesson={lesson} onComplete={() => setStep((s) => Math.min(s + 1, LESSONS.length - 1))} />
        <div className="flex gap-4">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}> Previous </Button>
          <Button onClick={() => {
            if (step === LESSONS.length - 1) navigate("/");
            else setStep((s) => s + 1);
          }}>
            {step === LESSONS.length - 1 ? "Done" : "Next"} <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default HowToPlayPage; 