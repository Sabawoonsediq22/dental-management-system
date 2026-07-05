import React from "react";
import { useTranslation } from "react-i18next";
import {
  Smile,
  Star,
  Rocket,
  Heart,
  Eye,
  Shield,
  Users,
  Tooth,
  Cloud,
  Headphones,
  MapPin,
  Mail,
  Globe,
  Phone,
  Clock,
} from "../../shared/icons/icons";

const About: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen w-full bg-linear-to-b from-gray-50 to-white space-y-10 text-gray-900 dark:from-gray-950 dark:to-gray-900 dark:text-gray-100">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-white shadow-sm border border-gray-100 dark:bg-gray-900 dark:border-gray-800">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-100 rounded-full blur-3xl opacity-60 dark:bg-red-950/70" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-red-50 rounded-full blur-3xl opacity-70 dark:bg-red-900/40" />

        <div className="grid md:grid-cols-2 gap-10 p-10 items-center relative">
          {/* Left */}
          <div className="space-y-5">
            <span className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-red-50 text-red-600 font-medium dark:bg-red-950/50 dark:text-red-300">
              {t("about.hero.badge", "About Parsa Technology")}
            </span>

            <h2 className="text-4xl font-extrabold leading-tight text-gray-900 dark:text-gray-100">
              {t("about.hero.titleLine1", "Building Smart Dental")}
              <span className="text-red-500">
                {" "}
                {t("about.hero.titleLine2", "Solutions")}
              </span>
            </h2>

            <p className="text-gray-600 leading-relaxed dark:text-gray-300">
              {t(
                "about.hero.description",
                "We design and develop secure, modern and scalable software that helps dental clinics manage patients, operations and growth with confidence and simplicity.",
              )}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <Stat icon={<Smile />} label="Happy Clients" value="10+" />
              <Stat icon={<Star />} label="Experience" value="3+" />
              <Stat icon={<Rocket />} label="Products" value="10+" />
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center justify-center">
            <div className="relative w-72 h-72 rounded-full bg-linear-to-br from-red-50 to-white border border-red-100 flex items-center justify-center shadow-inner overflow-hidden dark:from-red-950/50 dark:to-gray-900 dark:border-red-900/50">
              <img
                src="/parsa-technology.jpeg"
                alt={t("about.hero.imageAlt", "Parsa Technology")}
                className="h-full w-full rounded-full object-cover"
              />

              <div className="absolute inset-0 rounded-full border border-red-200 animate-pulse dark:border-red-800/50" />
            </div>
          </div>
        </div>
      </section>

      {/* MISSION / VISION / VALUES / TEAM */}
      <section className="grid md:grid-cols-4 gap-5">
        <InfoCard
          icon={<Heart />}
          title={t("about.cards.mission.title", "Mission")}
        >
          {t(
            "about.cards.mission.text",
            "Deliver powerful clinic software that simplifies daily workflows.",
          )}
        </InfoCard>

        <InfoCard
          icon={<Eye />}
          title={t("about.cards.vision.title", "Vision")}
        >
          {t(
            "about.cards.vision.text",
            "Become a global leader in dental technology solutions.",
          )}
        </InfoCard>

        <InfoCard
          icon={<Shield />}
          title={t("about.cards.values.title", "Values")}
        >
          {t(
            "about.cards.values.text",
            "Integrity, innovation, and customer-first thinking.",
          )}
        </InfoCard>

        <InfoCard icon={<Users />} title={t("about.cards.team.title", "Team")}>
          {t(
            "about.cards.team.text",
            "Skilled engineers focused on real-world healthcare impact.",
          )}
        </InfoCard>
      </section>

      {/* SERVICES */}
      <section className="space-y-5">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t("about.services.title", "Our Services")}
        </h3>

        <div className="grid md:grid-cols-4 gap-5">
          <ServiceCard
            icon={<Tooth />}
            title={t(
              "about.services.dentalManagement.title",
              "Dental Management",
            )}
            desc={t(
              "about.services.dentalManagement.desc",
              "Full clinic operations: patients, billing & records.",
            )}
          />
          <ServiceCard
            icon={<Rocket />}
            title={t("about.services.customSoftware.title", "Custom Software")}
            desc={t(
              "about.services.customSoftware.desc",
              "Tailor-made systems built for your workflow.",
            )}
          />
          <ServiceCard
            icon={<Cloud />}
            title={t("about.services.cloudBackup.title", "Cloud Backup")}
            desc={t(
              "about.services.cloudBackup.desc",
              "Secure and automated data protection.",
            )}
          />
          <ServiceCard
            icon={<Headphones />}
            title={t("about.services.support.title", "Support")}
            desc={t(
              "about.services.support.desc",
              "24/7 technical support and training.",
            )}
          />
        </div>
      </section>

      {/* LOCATION */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">
            {t("about.location.title", "Our Location")}
          </h3>
          <div className="h-64 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 dark:bg-gray-700 dark:text-gray-400">
            Map Coming Soon
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-lg font-semibold dark:text-gray-100">
            {t("about.contact.title", "Contact Information")}
          </h3>

          <Contact
            icon={<MapPin />}
            text={t("about.contact.address", "Behsood, Nangarhar, Afghanistan")}
          />
          <Contact
            icon={<Phone />}
            text={"+93 78 784 4487"}
          />
          <Contact
            icon={<Mail />}
            text={t("about.contact.email", "info@parsatechnology.com")}
          />
          <Contact
            icon={<Globe />}
            text={t("about.contact.website", "www.parsatechnology.com")}
          />
          <Contact
            icon={<Clock />}
            text={t("about.contact.hours", "Sat - Thu: 9:00 AM - 6:00 PM")}
          />
        </div>
      </section>
    </div>
  );
};

export default About;

/* ---------------- UI Components ---------------- */

const Stat = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="bg-gray-50 rounded-xl p-4 text-center hover:shadow-sm transition dark:bg-gray-800/80">
    <div className="text-red-500 flex justify-center">{icon}</div>
    <p className="text-lg font-bold mt-2 dark:text-gray-100">{value}</p>
    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
  </div>
);

const InfoCard = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition dark:bg-gray-800 dark:border-gray-700">
    <div className="text-red-500 mb-3">{icon}</div>
    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
      {title}
    </h4>
    <p className="text-sm text-gray-600 leading-relaxed dark:text-gray-300">
      {children}
    </p>
  </div>
);

const ServiceCard = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition dark:bg-gray-800 dark:border-gray-700">
    <div className="text-red-500 mb-3">{icon}</div>
    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
    <p className="text-sm text-gray-600 mt-2 dark:text-gray-300">{desc}</p>
  </div>
);

const Contact = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
    <span className="text-red-500">{icon}</span>
    {text}
  </div>
);
