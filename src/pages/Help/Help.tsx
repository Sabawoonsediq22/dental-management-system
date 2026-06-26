import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui";
import { ToothIcon, BillingIcon, DashboardIcon, PatientIcon } from "../../shared/icons/icons";

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-0">
      <button
        className="flex w-full items-center justify-between py-4 text-left cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-gray-900 dark:text-white">{question}</span>
        <span className="text-gray-500 dark:text-gray-400">{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && (
        <div className="pb-4 text-sm text-gray-600 dark:text-gray-300">
          {answer}
        </div>
      )}
    </div>
  );
};

const Help: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: DashboardIcon,
      title: t("help.features.dashboard", "Dashboard Overview"),
      description: t("help.features.dashboardDesc", "View clinic statistics, patient flow, and procedure distribution at a glance"),
    },
    {
      icon: PatientIcon,
      title: t("help.features.patients", "Patient Management"),
      description: t("help.features.patientsDesc", "Manage patient records, treatments, and visit history"),
    },
    {
      icon: ToothIcon,
      title: t("help.features.treatments", "Treatment Records"),
      description: t("help.features.treatmentsDesc", "Record and track dental procedures with tooth-specific details"),
    },
    {
      icon: BillingIcon,
      title: t("help.features.billing", "Billing & Invoices"),
      description: t("help.features.billingDesc", "Create invoices, record payments, and manage outstanding balances"),
    },
  ];

  const faqs = [
    {
      question: t("help.faq.q1", "How do I add a new patient?"),
      answer: t("help.faq.a1", "Navigate to the Patients page and click 'Add New Patient'. Fill in the patient details, medical history, and treatment information to create a complete record."),
    },
    {
      question: t("help.faq.q2", "How do I record a treatment?"),
      answer: t("help.faq.a2", "Go to a patient's profile and click 'New Visit'. Select procedures, specify treated teeth, add clinical notes, and generate the invoice in one workflow."),
    },
    {
      question: t("help.faq.q3", "How do I record a payment?"),
      answer: t("help.faq.a3", "Visit the Billing page, find the invoice, and click 'Record Payment'. Enter the payment amount and notes, then save to update the invoice status."),
    },
    {
      question: t("help.faq.q4", "Can I export patient data?"),
      answer: t("help.faq.a4", "Yes, visit the Reports page to export patient, financial, or treatment reports. Select the report type and download in your preferred format."),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
          {t("help.subtitle", "SUPPORT CENTER")}
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {t("help.title", "Help & Documentation")}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold">
              {t("help.sections.gettingStarted", "Getting Started")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {t("help.gettingStarted.intro", "Welcome to the Dental Clinic Management System. Follow these steps to begin:")}
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>{t("help.gettingStarted.step1", "Add new patients through the Patients section")}</li>
              <li>{t("help.gettingStarted.step2", "Record visits and treatments for each patient")}</li>
              <li>{t("help.gettingStarted.step3", "Generate invoices and track payments")}</li>
              <li>{t("help.gettingStarted.step4", "View reports and analytics in the Reports section")}</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold">
              {t("help.sections.quickActions", "Quick Actions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer">
                <PatientIcon size="md" className="mb-2 text-primary" />
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  {t("help.actions.addPatient", "Add Patient")}
                </span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer">
                <ToothIcon size="md" className="mb-2 text-primary" />
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  {t("help.actions.newVisit", "New Visit")}
                </span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg font-semibold">
            {t("help.sections.features", "Key Features")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="rounded-lg bg-blue-50 p-2 text-primary dark:bg-blue-900/30">
                  <feature.icon size="md" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg font-semibold">
            {t("help.sections.faq", "Frequently Asked Questions")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg font-semibold">
            {t("help.sections.contact", "Contact Support")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 w-20">Email:</span>
              <span className="text-gray-900 dark:text-white">support@dentalclinic.com</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 w-20">Phone:</span>
              <span className="text-gray-900 dark:text-white">+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 w-20">Hours:</span>
              <span className="text-gray-900 dark:text-white">Mon-Fri, 9AM-5PM</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Help;