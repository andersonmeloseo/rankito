import { useState, useEffect } from "react";
import { tutorialSteps } from "@/components/onboarding/tutorialSteps";

export const useTutorialProgress = () => {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Load progress from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("rankito_tutorial_progress");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompletedSteps(new Set(parsed));
      } catch (error) {
        console.error("Failed to load tutorial progress:", error);
      }
    }
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      "rankito_tutorial_progress",
      JSON.stringify(Array.from(completedSteps))
    );
  }, [completedSteps]);

  const markStepComplete = (stepId: string) => {
    setCompletedSteps((prev) => new Set([...prev, stepId]));
  };

  const markStepIncomplete = (stepId: string) => {
    setCompletedSteps((prev) => {
      const newSet = new Set(prev);
      newSet.delete(stepId);
      return newSet;
    });
  };

  const isStepComplete = (stepId: string) => {
    return completedSteps.has(stepId);
  };

  const markAllComplete = () => {
    const allStepIds = tutorialSteps.map((s) => s.id);
    setCompletedSteps(new Set(allStepIds));
  };

  const resetProgress = () => {
    setCompletedSteps(new Set());
    localStorage.removeItem("rankito_tutorial_progress");
  };

  const progress = {
    completed: completedSteps.size,
    total: tutorialSteps.length,
    percentage: Math.round((completedSteps.size / tutorialSteps.length) * 100),
  };

  return {
    completedSteps,
    markStepComplete,
    markStepIncomplete,
    isStepComplete,
    markAllComplete,
    resetProgress,
    progress,
  };
};
