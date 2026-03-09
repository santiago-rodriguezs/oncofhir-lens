'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { HowItWorksPanel } from '@/components/visualizer/HowItWorksPanel';
import { PitchPanel } from '@/components/visualizer/PitchPanel';

export default function HowItWorksPage() {
  return (
    <Tabs defaultValue="pitch" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="pitch">Pitch</TabsTrigger>
        <TabsTrigger value="how-it-works">Documentación Técnica</TabsTrigger>
      </TabsList>
      <TabsContent value="pitch">
        <PitchPanel />
      </TabsContent>
      <TabsContent value="how-it-works">
        <HowItWorksPanel />
      </TabsContent>
    </Tabs>
  );
}
