import Image from "next/image";
import ScheduleEditor from "../components/ScheduleEditor";
import styles from "./page.module.css";

const days = ["Luni", "Marti", "Miercuri", "Joi", "Vineri"];
const hours = [
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 13:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
];

const lowerClasses = [
  "Clasa a V-a",
  "Clasa a VI-a",
  "Clasa a VII-a",
  "Clasa a VIII-a",
];

const upperGrades = ["IX", "X", "XI", "XII"];
const sections = ["A", "B", "C", "D"];
const baseUpperClasses = upperGrades.flatMap((grade) => {
  const orderedSections =
    grade === "IX" ? [...sections, "F"] : sections;
  return orderedSections.map((section) => `Clasa a ${grade}-a ${section}`);
});
const upperClasses = baseUpperClasses;

const classGroups = [
  { title: "Clasele V – VIII", classes: lowerClasses },
  { title: "Clasele IX – XII", classes: upperClasses },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.logoWrapper}>
            <Image
              src="/LogoColegiuRemasteredALB.png"
              alt="Logo Scoala"
              width={200}
              height={200}
              priority
              className={styles.schoolLogo}
            />
          </div>
          <h1>Școala altfel</h1>
          <p className={styles.subhead}>Clasele V — XII</p>
          <span className={styles.classLabel}>15.12 – 19.12.2025</span>
        </header>

        <ScheduleEditor classGroups={classGroups} days={days} hours={hours} />
      </main>
    </div>
  );
}
