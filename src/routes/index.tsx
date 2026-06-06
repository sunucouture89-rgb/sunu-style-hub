import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Categories } from "@/components/landing/Categories";
import { Creations } from "@/components/landing/Creations";
import { PremiumSlider } from "@/components/landing/PremiumSlider";
import { AllListings } from "@/components/landing/AllListings";
import { Couturiers } from "@/components/landing/Couturiers";
import { SurMesure } from "@/components/landing/SurMesure";
import { Testimonials } from "@/components/landing/Testimonials";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Sunu Couture — La maison sénégalaise du sur-mesure" },
      {
        name: "description",
        content:
          "Découvrez les plus belles créations des couturiers sénégalais : boubou, bazin riche, tenues de mariage et broderies d'exception. Commandez en sur-mesure.",
      },
      { property: "og:title", content: "Sunu Couture — Couture sénégalaise premium" },
      { property: "og:description", content: "L'élégance africaine cousue main, livrée partout au Sénégal." },
      { property: "og:type", content: "website" },
    ],
  }),
});

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <Categories />
      <PremiumSlider />
      <Creations />
      <Couturiers />
      <SurMesure />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  );
}
