import { useLanguage } from "../../context/LanguageContext";
import {
  COMMON_PACES,
  PACE_CLASSIFICATIONS,
  PACE_TARGETS,
  getPaceGuideCopy,
} from "../../data/racePaceGuide";

const CARD = "min-w-0 border-2 border-retro-gray-light bg-retro-black p-5 sm:p-6";
const TABLE_HEAD = "border-b border-retro-gray-light px-3 py-3 text-left font-mono text-xs font-bold text-retro-white";
const TABLE_CELL = "border-b border-retro-gray-light/40 px-3 py-3 text-left font-mono text-sm text-retro-white";

function GuideCard({ id, number, title, icon, children }) {
  return (
    <section aria-labelledby={id} className={CARD}>
      <div className="mb-4 flex items-start gap-3">
        <span
          aria-hidden="true"
          className="border border-retro-green px-2 py-1 font-mono text-xs font-bold text-retro-green"
        >
          {number}
        </span>
        <h3 id={id} className="font-retro text-2xl tracking-wide text-retro-white sm:text-3xl">
          {icon && <span aria-hidden="true" className="mr-2">{icon}</span>}
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

function ScrollableTable({ title, hint, children }) {
  return (
    <>
      <p className="mb-2 font-sport text-sm text-retro-white sm:hidden">{hint}</p>
      <div
        role="region"
        aria-label={title}
        tabIndex={0}
        className="overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retro-green"
      >
        {children}
      </div>
    </>
  );
}

export default function RacePaceGuide() {
  const language = useLanguage()?.language === "id" ? "id" : "en";
  const copy = getPaceGuideCopy(language);

  return (
    <section aria-labelledby="pace-guide-title" className="mt-3 border-t-2 border-retro-gray-light pt-8">
      <div className="mb-5 bg-retro-black py-2">
        <p className="font-mono text-xs font-bold tracking-widest text-retro-green">
          // {copy.eyebrow}
        </p>
        <h2 id="pace-guide-title" className="mt-2 font-retro text-4xl tracking-wide text-retro-white sm:text-5xl">
          {copy.title}
        </h2>
        <p className="mt-2 max-w-3xl font-sport text-lg leading-relaxed text-retro-white">
          {copy.intro}
        </p>
      </div>

      <div className="space-y-5">
        <div className="border-l-4 border-retro-green bg-retro-black px-4 py-3">
          <p className="font-sport text-base leading-relaxed text-retro-white">{copy.disclaimer}</p>
        </div>

        <GuideCard id="pace-about" number="01" title={copy.aboutTitle}>
          <p className="font-sport text-lg leading-relaxed text-retro-white">{copy.aboutText}</p>
          <h4 className="mb-3 mt-5 font-mono text-sm font-bold text-retro-white">{copy.commonTitle}:</h4>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {COMMON_PACES.map((item) => (
              <li key={item.key} className="border border-retro-green/50 bg-retro-green/5 px-3 py-3">
                <p className="font-sport text-base leading-tight text-retro-white">{item.label[language]}</p>
                <p className="mt-1 font-retro text-2xl tracking-wide text-retro-white tabular-nums">
                  {item.pace} <span className="font-mono text-xs">{copy.unit}</span>
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-sport text-sm text-retro-white">{copy.paceFormat}</p>
        </GuideCard>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <GuideCard id="pace-definition" number="02" title={copy.whatTitle}>
            <div className="space-y-3">
              {copy.whatParagraphs.map((paragraph) => (
                <p key={paragraph} className="font-sport text-base leading-relaxed text-retro-white">{paragraph}</p>
              ))}
            </div>
          </GuideCard>
          <GuideCard id="pace-formulas" number="03" title={copy.formulaTitle}>
            <div className="space-y-3">
              {copy.formulas.map((formula) => (
                <div key={formula.label} className="border border-retro-green/50 bg-retro-green/5 px-4 py-3">
                  <p className="font-mono text-sm font-bold text-retro-white">{formula.label}</p>
                  <p className="mt-1 font-sport text-lg leading-snug text-retro-white">= {formula.expression}</p>
                </div>
              ))}
            </div>
          </GuideCard>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <GuideCard id="pace-classification" number="04" title={copy.classificationTitle}>
            <p className="mb-3 font-sport text-base leading-relaxed text-retro-white">{copy.classificationIntro}</p>
            <ScrollableTable title={copy.classificationTitle} hint={copy.scrollHint}>
              <table className="w-full min-w-[410px] border-collapse">
                <caption className="sr-only">{copy.classificationTitle}</caption>
                <thead>
                  <tr>
                    <th scope="col" className={TABLE_HEAD}>{copy.categoryHeading}</th>
                    <th scope="col" className={`${TABLE_HEAD} whitespace-nowrap`}>{copy.paceHeading}</th>
                    <th scope="col" className={TABLE_HEAD}>{copy.speedHeading}</th>
                  </tr>
                </thead>
                <tbody>
                  {PACE_CLASSIFICATIONS.map((item) => (
                    <tr key={item.key}>
                      <th scope="row" className={`${TABLE_CELL} font-sport text-base font-normal`}>{item.label[language]}</th>
                      <td className={`${TABLE_CELL} whitespace-nowrap tabular-nums`}>{item.pace}</td>
                      <td className={`${TABLE_CELL} whitespace-nowrap tabular-nums`}>{item.speed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollableTable>
          </GuideCard>

          <GuideCard id="pace-targets" number="05" title={copy.targetTitle}>
            <p className="mb-1 font-sport text-base leading-relaxed text-retro-white">{copy.targetIntro}</p>
            <p className="mb-3 font-sport text-sm text-retro-white">{copy.targetUnitNote}</p>
            <ScrollableTable title={copy.targetTitle} hint={copy.scrollHint}>
              <table className="w-full min-w-[480px] border-collapse">
                <caption className="sr-only">{copy.targetTitle} — {copy.targetUnitNote}</caption>
                <thead>
                  <tr>
                    {[copy.distanceHeading, copy.beginnerHeading, copy.intermediateHeading, copy.advancedHeading].map((heading) => (
                      <th key={heading} scope="col" className={`${TABLE_HEAD} whitespace-nowrap`}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PACE_TARGETS.map((item) => (
                    <tr key={item.distance}>
                      <th scope="row" className={`${TABLE_CELL} font-sport text-base font-normal`}>{item.distance}</th>
                      <td className={`${TABLE_CELL} whitespace-nowrap tabular-nums`}>{item.beginner}</td>
                      <td className={`${TABLE_CELL} whitespace-nowrap tabular-nums`}>{item.intermediate}</td>
                      <td className={`${TABLE_CELL} whitespace-nowrap tabular-nums`}>{item.advanced}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollableTable>
          </GuideCard>
        </div>

        <GuideCard id="pace-tips" number="06" title={copy.tipsTitle} icon="💡">
          <ul className="space-y-3">
            {copy.tips.map((tip) => (
              <li key={tip} className="flex gap-3 font-sport text-base leading-relaxed text-retro-white">
                <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 bg-retro-green" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </GuideCard>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <GuideCard id="pace-zones" number="07" title={copy.zonesTitle}>
            <p className="mb-3 font-sport text-base leading-relaxed text-retro-white">{copy.zonesIntro}</p>
            <ul>
              {copy.zones.map((zone) => (
                <li key={zone.name} className="border-b border-retro-gray-light/40 py-3 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <strong className="font-sport text-lg text-retro-white">{zone.name}</strong>
                    <span className="font-mono text-xs font-bold text-retro-green">{zone.range}</span>
                  </div>
                  <p className="mt-1 font-sport text-base leading-relaxed text-retro-white">{zone.description}</p>
                </li>
              ))}
            </ul>
          </GuideCard>
          <GuideCard id="pace-factors" number="08" title={copy.factorsTitle}>
            <ul className="space-y-4">
              {copy.factors.map((factor) => (
                <li key={factor.label} className="flex gap-3 font-sport text-base leading-relaxed text-retro-white">
                  <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 bg-retro-green" />
                  <p><strong>{factor.label}:</strong> {factor.description}</p>
                </li>
              ))}
            </ul>
          </GuideCard>
        </div>

        <GuideCard id="pace-faq" number="09" title={copy.faqTitle}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {copy.faqs.map((faq) => (
              <div key={faq.question} className="border border-retro-green/50 bg-retro-green/5 p-4">
                <h4 className="font-sport text-lg font-bold leading-snug text-retro-white">{faq.question}</h4>
                <p className="mt-2 font-sport text-base leading-relaxed text-retro-white">{faq.answer}</p>
              </div>
            ))}
          </div>
        </GuideCard>

        <p className="font-sport text-sm text-retro-white">
          {copy.sourcePrefix}{" "}
          <a
            href="https://hdmall.id/kalkulator-kesehatan/pace-calculator.html"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-retro-green underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-retro-green"
          >
            {copy.sourceLabel}
          </a>
          .
        </p>
      </div>
    </section>
  );
}
