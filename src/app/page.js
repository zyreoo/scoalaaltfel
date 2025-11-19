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
const baseUpperClasses = upperGrades.flatMap((grade) =>
  sections.map((section) => `Clasa a ${grade}-a ${section}`)
);
const upperClasses = [...baseUpperClasses, "Clasa a IX-a F"];

const classGroups = [
  { title: "Clasele V – VIII", classes: lowerClasses },
  { title: "Clasele IX – XII", classes: upperClasses },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <span className={styles.classLabel}>
            Ore 08:00 – 15:00 · Luni — Vineri
          </span>
          <h1>Școala altfel</h1>
          <p className={styles.subhead}>
            Clasele V — XII · completare ulterioară a activităților
          </p>
        </header>

        <div className={styles.groups}>
          {classGroups.map((group) => (
            <section className={styles.group} key={group.title}>
              <div className={styles.groupHeading}>
                <p>{group.title}</p>
              </div>
              <div className={styles.classGrid}>
                {group.classes.map((className) => (
                  <article className={styles.classCard} key={className}>
                    <div className={styles.classCardHeader}>
                      <h2>{className}</h2>
                      <span>orar gol</span>
                    </div>
                    <div className={styles.tableContainer}>
                      <table className={styles.scheduleTable}>
                        <thead>
                          <tr>
                            <th scope="col">Ora</th>
                            {days.map((day) => (
                              <th scope="col" key={`${className}-${day}`}>
                                {day}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {hours.map((time) => (
                            <tr key={`${className}-${time}`}>
                              <th scope="row">{time}</th>
                              {days.map((day) => (
                                <td
                                  key={`${className}-${time}-${day}`}
                                  aria-label={`${className} ${day} ${time}`}
                                />
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
