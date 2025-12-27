"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/lib/i18n/context";
import { ArrowRight, Zap, Shield, Clock, CheckCircle, User, Lock, Package, Wrench, Building2, Award, Phone, Mail, MapPin, Linkedin, Facebook, Instagram, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

export default function HomePage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
        <div className="absolute inset-0 bg-grid-gray-200/50 dark:bg-grid-gray-800/50"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Theme & Language Toggle - Top Right */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-6xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-blue-600/10 dark:bg-blue-400/10 border border-blue-200 dark:border-blue-800">
              <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {t('home.professionalPowerSolutions')}
              </span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-900 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent leading-tight">
              {t('home.ataGenerators')}
              <br />
              <span className="text-5xl md:text-6xl">{t('home.powerSolutions')}</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              {t('home.trustedPartner')}
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {[
                { icon: Shield, text: t('home.certifiedQuality') },
                { icon: Clock, text: t('home.fastDelivery') },
                { icon: CheckCircle, text: t('home.support24_7') },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  <feature.icon className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Portal Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
            <Link
              href="/client/login"
              className="group relative p-8 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-950/30 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-green-200/50 dark:border-green-900/50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/0 to-green-600/0 group-hover:from-green-400/5 group-hover:to-green-600/5 transition-all duration-300"></div>
              
              <div className="relative">
                <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                    <User className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-3 flex items-center justify-center gap-2">
                  {t('home.clientPortal')}
                  <ArrowRight className="h-6 w-6 transform group-hover:translate-x-2 transition-transform" />
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-lg">
                  {t('home.requestQuotations')}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                  <span>{t('home.getStarted')}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
            
            <Link
              href="/login"
              className="group relative p-8 bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-950/30 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-indigo-200/50 dark:border-indigo-900/50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/0 to-indigo-600/0 group-hover:from-indigo-400/5 group-hover:to-indigo-600/5 transition-all duration-300"></div>
              
              <div className="relative">
                <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Lock className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-3 flex items-center justify-center gap-2">
                  {t('home.adminDashboard')}
                  <ArrowRight className="h-6 w-6 transform group-hover:translate-x-2 transition-transform" />
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-lg">
                  {t('home.completeCrm')}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  <span>{t('home.signIn')}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>

            <Link
              href="/login?callbackUrl=/team"
              className="group relative p-8 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-950/30 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-blue-200/50 dark:border-blue-900/50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-blue-600/0 group-hover:from-blue-400/5 group-hover:to-blue-600/5 transition-all duration-300"></div>
              
              <div className="relative">
                <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                    <Building2 className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-3 flex items-center justify-center gap-2">
                  {t('home.ourTeam')}
                  <ArrowRight className="h-6 w-6 transform group-hover:translate-x-2 transition-transform" />
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-lg">
                  {t('home.manageTasks')}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                  <span>{t('home.signIn')}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          </div>

          {/* How it Works */}
          <div className="max-w-4xl mx-auto p-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('home.howItWorks')}
            </h3>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: "1", title: t('home.register'), desc: t('home.createAccount') },
                { step: "2", title: t('home.request'), desc: t('home.submitSpecifications') },
                { step: "3", title: t('home.quotation'), desc: t('home.receiveApprovePdf') },
                { step: "4", title: t('home.track'), desc: t('home.monitorPoDelivery') },
              ].map((item, idx) => (
                <div key={idx} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg mb-3 shadow-lg">
                      {item.step}
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.desc}
                    </p>
                  </div>
                  {idx < 3 && (
                    <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-gradient-to-r from-blue-300 to-purple-300 dark:from-blue-700 dark:to-purple-700 -z-10"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* About Us Section */}
      <section className="relative py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('home.aboutAta')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {t('home.leadingProvider')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                {t('home.whoWeAre')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                {t('home.ataDescription')}
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {t('home.ataCommitment')}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">10+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('home.yearsExperience')}</div>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">200+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('home.projectsCompleted')}</div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">50+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('home.happyClients')}</div>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">24/7</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('home.supportAvailable')}</div>
                </div>
              </div>
            </div>
            <div className="relative h-96 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/images/about/company-photo.jpg.png"
                alt="ATA Generators & Power Solutions Company"
                fill
                className="object-cover rounded-2xl"
                quality={95}
                priority
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950">
                        <div class="text-center text-gray-400 dark:text-gray-600">
                          <svg class="h-32 w-32 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                          </svg>
                          <p class="text-lg">Company Image Placeholder</p>
                          <p class="text-sm">Add company photo at /images/about/company-photo.jpg.png</p>
                        </div>
                      </div>
                    `;
                  }
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="relative py-20 bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('home.ourProducts')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {t('home.comprehensivePowerSolutions')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Generators */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2">
              <CardContent className="p-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-center mb-3 text-gray-900 dark:text-white">
                  {t('home.generators')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                  {t('home.generatorsDescription')}
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {t('home.industrialGradeQuality')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {t('home.silentOptions')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {t('home.rentalSales')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {t('home.fullInstallationSupport')}
                  </li>
                </ul>
                <Button className="w-full" variant="outline">
                  {t('home.learnMore')}
                </Button>
              </CardContent>
            </Card>

            {/* ATS Systems */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-purple-200 dark:border-purple-900">
              <CardContent className="p-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-center mb-3 text-gray-900 dark:text-white">
                  {t('home.atsSystems')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                  {t('home.atsDescription')}
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {t('home.automaticSwitching')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {t('home.ratings')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {t('home.phaseOptions')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {t('home.customConfigurations')}
                  </li>
                </ul>
                <Button className="w-full" variant="outline">
                  {t('home.learnMore')}
                </Button>
              </CardContent>
            </Card>

            {/* Switchgear */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-orange-200 dark:border-orange-900">
              <CardContent className="p-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Wrench className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-center mb-3 text-gray-900 dark:text-white">
                  {t('home.switchgear')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                  {t('home.switchgearDescription')}
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {t('home.lowMediumVoltage')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {t('home.customDesign')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {t('home.testingCommissioning')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {t('home.sparePartsAvailable')}
                  </li>
                </ul>
                <Button className="w-full" variant="outline">
                  {t('home.learnMore')}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              {t('home.viewAllProducts')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Our Work Section */}
      <section className="relative py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('home.ourWork')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {t('home.poweringBusinesses')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Project 1 - Sukatra Island */}
            <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <div className="relative h-64 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 overflow-hidden">
                <Image
                  src="/images/projects/sukatra-island-project.jpg"
                  alt="Sukatra Island Power Solution Project"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                  quality={85}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950">
                          <div class="text-center text-gray-400">
                            <svg class="h-24 w-24 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                            <p>Sukatra Island Project</p>
                          </div>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                    {t('home.island')}
                  </span>
                  <span className="text-sm text-gray-500">{t('home.sukatra')}</span>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                  {t('home.sukatraIslandPower')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t('home.sukatraDescription')}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span>{t('home.islandPower')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>{t('home.completed2024')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project 2 */}
            <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <div className="relative h-64 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950 dark:to-pink-950 overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&h=800&fit=crop"
                  alt="5-Star Hotel Power Solution Project"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  quality={85}
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950 dark:to-pink-950">
                          <div class="text-center text-gray-400">
                            <svg class="h-24 w-24 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                            <p>Hotel Project</p>
                          </div>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold">
                    {t('home.hospitality')}
                  </span>
                  <span className="text-sm text-gray-500">{t('home.abuDhabi')}</span>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                  {t('home.hotelPowerSolution')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t('home.hotelDescription')}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-purple-600" />
                    <span>1000KVA</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>{t('home.completed2024')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project 3 */}
            <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <div className="relative h-64 bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-950 dark:to-teal-950 overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&h=800&fit=crop"
                  alt="Manufacturing Plant Power Project"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  quality={85}
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-950 dark:to-teal-950">
                          <div class="text-center text-gray-400">
                            <svg class="h-24 w-24 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                            <p>Factory Project</p>
                          </div>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                    {t('home.industrial')}
                  </span>
                  <span className="text-sm text-gray-500">{t('home.sharjah')}</span>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                  {t('home.manufacturingPlantPower')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t('home.manufacturingDescription')}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-green-600" />
                    <span>1500KVA</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>{t('home.completed2023')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project 4 */}
            <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <div className="relative h-64 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-950 dark:to-red-950 overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=800&fit=crop"
                  alt="Office Tower Backup System Project"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  quality={85}
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-950 dark:to-red-950">
                          <div class="text-center text-gray-400">
                            <svg class="h-24 w-24 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                            <p>Commercial Building</p>
                          </div>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 rounded-full text-xs font-semibold">
                    {t('home.commercial')}
                  </span>
                  <span className="text-sm text-gray-500">{t('home.dubai')}</span>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                  {t('home.officeTowerBackup')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t('home.officeDescription')}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-orange-600" />
                    <span>750KVA</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>{t('home.completed2024')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" variant="outline" className="border-2">
              {t('home.viewAllProjects')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Meet Our Team Section */}
      <section className="relative py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-blue-950">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('home.meetOurTeam')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {t('home.experiencedProfessionals')}
            </p>
          </div>

          {/* Founders & Management */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
              {t('home.leadershipTeam')}
            </h3>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* CEO */}
              <Card className="text-center hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="w-64 h-64 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl">
                    <Image
                      src="/images/team/ceo.jpg"
                      alt="CEO"
                      width={256}
                      height={256}
                      quality={85}
                      loading="lazy"
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<User className="h-28 w-28 text-white" />';
                        }
                      }}
                    />
                  </div>
                  <h4 className="text-2xl font-bold mb-2 text-blue-600 dark:text-blue-400">
                    {t('home.ceo')}
                  </h4>
                  <p className="text-gray-900 dark:text-white font-semibold mb-3 text-lg">
                    YASIR ADNAN
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('home.chiefExecutiveOfficer')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('home.ceoDescription')}
                  </p>
                </CardContent>
              </Card>

              {/* Partner */}
              <Card className="text-center hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="w-64 h-64 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl">
                    <Image
                      src="/images/team/partner.jpg"
                      alt="Partner"
                      width={256}
                      height={256}
                      quality={85}
                      loading="lazy"
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<User className="h-28 w-28 text-white" />';
                        }
                      }}
                    />
                  </div>
                  <h4 className="text-2xl font-bold mb-2 text-purple-600 dark:text-purple-400">
                    {t('home.partner')}
                  </h4>
                  <p className="text-gray-900 dark:text-white font-semibold mb-3 text-lg">
                    NAHIDH KASHMOLA
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('home.businessPartner')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('home.partnerDescription')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Team Members */}
          <div>
            <h3 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
              {t('home.ourTechnicalTeam')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: "AHMED ADEL", role: t('home.operationManager'), color: "from-blue-500 to-blue-600", image: "/images/team/operation-manager.jpg" },
                { name: t('home.seniorTechnician'), role: t('home.seniorTechnician'), color: "from-purple-500 to-purple-600", image: "/images/team/senior-technician.jpg" },
                { name: t('home.maintenanceLead'), role: t('home.maintenanceLead'), color: "from-green-500 to-green-600", image: "/images/team/maintenance-lead.jpg" },
                { name: `${t('home.technician')} 1`, role: t('home.technician'), color: "from-orange-500 to-orange-600", image: "/images/team/technician-1.jpg" },
                { name: `${t('home.technician')} 2`, role: t('home.technician'), color: "from-cyan-500 to-cyan-600", image: "/images/team/technician-2.jpg" },
                { name: `${t('home.technician')} 3`, role: t('home.technician'), color: "from-pink-500 to-pink-600", image: "/images/team/technician-3.jpg" },
                { name: `${t('home.technician')} 4`, role: t('home.technician'), color: "from-teal-500 to-teal-600", image: "/images/team/technician-4.jpg" },
              ].map((member, idx) => (
                <Card key={idx} className="text-center hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-5">
                    <div className={`w-36 h-36 mx-auto mb-4 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg relative`}>
                      <Image
                        src={member.image}
                        alt={member.name}
                        width={144}
                        height={144}
                        quality={85}
                        loading="lazy"
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div className={`absolute inset-0 bg-gradient-to-br ${member.color} flex items-center justify-center`} style={{ display: 'none' }}>
                        <User className="h-16 w-16 text-white" />
                      </div>
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1 text-lg">
                      {member.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {member.role}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">25+</div>
              <div className="text-gray-600 dark:text-gray-400">{t('home.teamMembers')}</div>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">15+</div>
              <div className="text-gray-600 dark:text-gray-400">{t('home.engineers')}</div>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">10+</div>
              <div className="text-gray-600 dark:text-gray-400">{t('home.technicians')}</div>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">24/7</div>
              <div className="text-gray-600 dark:text-gray-400">{t('home.supportTeam')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & CTA Section */}
      <section className="relative py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                {t('home.readyToGetStarted')}
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                {t('home.joinCompanies')}
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold">{t('home.callUs')}</div>
                    <div className="text-blue-100">+971 XX XXX XXXX</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold">{t('home.emailUs')}</div>
                    <div className="text-blue-100">info@ata-generators.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold">{t('home.visitUs')}</div>
                    <div className="text-blue-100">{t('home.unitedArabEmirates')}</div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <Link href="https://linkedin.com" target="_blank">
                  <Button variant="secondary" size="icon" className="rounded-full">
                    <Linkedin className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="https://facebook.com" target="_blank">
                  <Button variant="secondary" size="icon" className="rounded-full">
                    <Facebook className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="https://instagram.com" target="_blank">
                  <Button variant="secondary" size="icon" className="rounded-full">
                    <Instagram className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl">
              <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                {t('home.requestQuote')}
              </h3>
              <form className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder={t('home.yourName')}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder={t('home.companyName')}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder={t('home.emailAddress')}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder={t('home.phoneNumber')}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <textarea
                    placeholder={t('home.tellUsRequirements')}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none resize-none"
                  ></textarea>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
                  size="lg"
                >
                  {t('home.sendRequest')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
              <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                {t('home.alreadyClient')}{" "}
                <Link href="/client/login" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                  {t('home.loginToPortal')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-black dark:via-gray-950 dark:to-black text-white overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative container mx-auto px-4 max-w-6xl py-16">
          {/* Top Section */}
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            {/* Company Info */}
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {t('home.ataGeneratorsFooter')}
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                {t('home.leadingProviderFooter')}
              </p>
              
              {/* Contact Quick Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                  <Phone className="h-4 w-4 text-blue-400" />
                  <span className="text-sm">+971 XX XXX XXXX</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                  <Mail className="h-4 w-4 text-purple-400" />
                  <span className="text-sm">info@ata-generators.com</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                  <MapPin className="h-4 w-4 text-pink-400" />
                  <span className="text-sm">Dubai, United Arab Emirates</span>
                </div>
              </div>

              {/* Social Media */}
              <div className="flex gap-3 mt-6">
                <Link 
                  href="https://linkedin.com" 
                  target="_blank"
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 flex items-center justify-center transition-all hover:scale-110"
                >
                  <Linkedin className="h-5 w-5" />
                </Link>
                <Link 
                  href="https://facebook.com" 
                  target="_blank"
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 flex items-center justify-center transition-all hover:scale-110"
                >
                  <Facebook className="h-5 w-5" />
                </Link>
                <Link 
                  href="https://instagram.com" 
                  target="_blank"
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 flex items-center justify-center transition-all hover:scale-110"
                >
                  <Instagram className="h-5 w-5" />
                </Link>
              </div>
            </div>

            {/* Products */}
            <div>
              <h4 className="font-bold text-lg mb-4 text-white">{t('home.products')}</h4>
              <ul className="space-y-3">
                {[
                  { name: t('home.generators'), icon: Zap },
                  { name: t('home.atsSystemsFooter'), icon: Package },
                  { name: t('home.switchgear'), icon: Wrench },
                  { name: t('home.spareParts'), icon: Award },
                ].map((item, idx) => (
                  <li key={idx}>
                    <Link 
                      href="#products" 
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                    >
                      <item.icon className="h-4 w-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
                      <span className="text-sm">{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-lg mb-4 text-white">{t('home.company')}</h4>
              <ul className="space-y-3">
                {[
                  { name: t('home.aboutUs'), href: "#about" },
                  { name: t('home.ourTeam'), href: "#team" },
                  { name: t('home.portfolio'), href: "#work" },
                  { name: t('home.contact'), href: "#contact" },
                ].map((item, idx) => (
                  <li key={idx}>
                    <Link 
                      href={item.href} 
                      className="text-sm text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Client Area */}
            <div>
              <h4 className="font-bold text-lg mb-4 text-white">{t('home.clientArea')}</h4>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/client/login" 
                    className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
                  >
                    <User className="h-4 w-4 text-green-400 group-hover:text-green-300" />
                    <span>{t('home.clientLogin')}</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/client/register" 
                    className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
                  >
                    <CheckCircle className="h-4 w-4 text-green-400 group-hover:text-green-300" />
                    <span>{t('home.register')}</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/login" 
                    className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
                  >
                    <Lock className="h-4 w-4 text-purple-400 group-hover:text-purple-300" />
                    <span>{t('home.adminLogin')}</span>
                  </Link>
                </li>
              </ul>

              {/* Quick CTA */}
              <div className="mt-6">
                <Link href="/client/register">
                  <Button 
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg hover:shadow-xl transition-all"
                    size="sm"
                  >
                    {t('home.getStartedFree')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Divider with gradient */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-8"></div>

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <Link href="#about" className="hover:text-white transition-colors">
                {t('home.aboutUs')}
              </Link>
              <span className="text-gray-700">•</span>
              <Link href="#contact" className="hover:text-white transition-colors">
                {t('home.contact')}
              </Link>
              <span className="text-gray-700">•</span>
              <Link href="#work" className="hover:text-white transition-colors">
                {t('home.portfolio')}
              </Link>
              <span className="text-gray-700">•</span>
              <Link href="/client/login" className="hover:text-white transition-colors">
                {t('home.clientPortal')}
              </Link>
            </div>

            <div className="text-center md:text-right">
              <p className="text-sm text-gray-400">
                © 2025 <span className="font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{t('home.ataGeneratorsFooter')}</span>. {t('home.allRightsReserved')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t('home.poweredBy')}
              </p>
            </div>
          </div>

          {/* Decorative Bottom Line */}
          <div className="mt-8 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full"></div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
