"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../app/page.module.css";

const blankForm = {
  activity: "",
  professor: "",
};

export default function ScheduleEditor({
  classGroups,
  days,
  hours,
  classHourLabelOverrides = {},
}) {
  const [entries, setEntries] = useState({});
  const [selectedCell, setSelectedCell] = useState(null);
  const [formValues, setFormValues] = useState(blankForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const allClasses = useMemo(
    () => classGroups.flatMap((group) => group.classes),
    [classGroups]
  );
  const [activeClass, setActiveClass] = useState(allClasses[0] ?? "");
  const classRefs = useRef({});

  useEffect(() => {
    void loadEntries();
  }, []);

  useEffect(() => {
    setActiveClass((prev) => prev || allClasses[0] || "");
  }, [allClasses]);

  useEffect(() => {
    const refs = classRefs.current;
    Object.keys(refs).forEach((className) => {
      if (!allClasses.includes(className)) {
        delete refs[className];
      }
    });
  }, [allClasses]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  async function loadEntries() {
    try {
      const response = await fetch("/api/schedule", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Nu am putut încărca orarul.");
      }

      const payload = await response.json();
      const map = {};
      payload.entries?.forEach((entry) => {
        const key = entryKey(entry.class_name, entry.day, entry.time);
        map[key] = entry;
      });

      setEntries(map);
    } catch (error) {
      setStatusMessage(error.message);
    }
  }

  const orderedGroups = useMemo(
    () =>
      classGroups.map((group) => ({
        ...group,
        classes: [...group.classes],
      })),
    [classGroups]
  );

  function entryKey(className, day, time) {
    return `${className}|${day}|${time}`;
  }

  function getTimeLabel(className, time) {
    if (!className || !time) return time;
    return classHourLabelOverrides[className]?.[time] ?? time;
  }

  function handleCellClick(className, day, time) {
    const key = entryKey(className, day, time);
    const existing = entries[key];

    setSelectedCell({ className, day, time, key });
    setFormValues({
      activity: existing?.activity ?? "",
      professor: existing?.professor ?? "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedCell(null);
    setFormValues(blankForm);
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedCell) return;
    setSaving(true);
    setStatusMessage(null);

    const activity = formValues.activity.trim();
    const professor = formValues.professor.trim();

    try {
      if (!activity && !professor) {
        const response = await fetch("/api/schedule", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            className: selectedCell.className,
            day: selectedCell.day,
            time: selectedCell.time,
          }),
        });

        if (!response.ok) {
          throw new Error("Nu am putut șterge slotul.");
        }

        setEntries((prev) => {
          const next = { ...prev };
          delete next[selectedCell.key];
          return next;
        });
        closeModal();
        return;
      }

      const payload = {
        className: selectedCell.className,
        day: selectedCell.day,
        time: selectedCell.time,
        activity,
        professor,
      };

      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Nu am putut salva slotul.");
      }

      const { entry } = await response.json();
      setEntries((prev) => ({ ...prev, [selectedCell.key]: entry }));
      closeModal();
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleClearSlot() {
    if (!selectedCell) return;
    setFormValues(blankForm);
    setStatusMessage(
      "Câmpurile au fost golite. Introdu o activitate nouă și apasă Salvează."
    );
  }

  function renderCellButton(className, day, time) {
    const key = entryKey(className, day, time);
    const entry = entries[key];
    const label = entry
      ? `${entry.activity} — ${entry.professor}`
      : "Adaugă activitate";

    const displayTime = getTimeLabel(className, time);
    return (
      <button
        type="button"
        className={styles.cellButton}
        onClick={() => handleCellClick(className, day, time)}
        aria-label={`${className} ${day} ${displayTime}: ${label}`}
      >
        {entry ? (
          <div className={styles.cellContent}>
            <span className={styles.cellActivity}>{entry.activity}</span>
            <span className={styles.cellProfessor}>{entry.professor}</span>
          </div>
        ) : (
          <span className={styles.cellPlaceholder}>Adaugă</span>
        )}
      </button>
    );
  }

  function renderTableCell(className, day, time) {
    const key = entryKey(className, day, time);
    return <td key={key}>{renderCellButton(className, day, time)}</td>;
  }

  function renderMobileSchedule(className) {
    return (
      <div className={styles.mobileSchedule}>
        {days.map((day) => (
          <div
            className={styles.mobileDaySection}
            key={`${className}-${day}`}
          >
            <div className={styles.mobileDayHeader}>{day}</div>
            <div className={styles.mobileTimeGrid}>
              {hours.map((time) => (
                <div
                  className={styles.mobileTimeRow}
                  key={`${className}-${day}-${time}`}
                >
                  <span className={styles.mobileTimeLabel}>
                    {getTimeLabel(className, time)}
                  </span>
                  <div className={styles.mobileTimeContent}>
                    {renderCellButton(className, day, time)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function registerClassRef(className, node) {
    if (!node) {
      delete classRefs.current[className];
      return;
    }
    classRefs.current[className] = node;
  }

  function handleClassSelection(className, { scrollToCard = false } = {}) {
    if (!className) return;
    setActiveClass(className);
    if (!isMobile && scrollToCard) {
      const target = classRefs.current[className];
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <>
      {!isMobile && allClasses.length > 0 && (
        <div className={styles.desktopControls}>
          <label
            className={styles.desktopSelectWrapper}
            htmlFor="class-select-desktop"
          >
            <span>Selectează clasa</span>
            <select
              id="class-select-desktop"
              value={activeClass}
              onChange={(event) =>
                handleClassSelection(event.target.value, {
                  scrollToCard: true,
                })
              }
              className={styles.desktopSelect}
            >
              {allClasses.map((className) => (
                <option value={className} key={className}>
                  {className}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {isMobile && allClasses.length > 0 && (
        <div className={styles.mobileControls}>
          <label htmlFor="class-select-mobile">
            <span>Selectează clasa</span>
            <select
              id="class-select-mobile"
              value={activeClass}
              onChange={(event) => handleClassSelection(event.target.value)}
              className={styles.mobileSelect}
            >
              {allClasses.map((className) => (
                <option value={className} key={className}>
                  {className}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className={styles.groups}>
        {orderedGroups.map((group) => {
          const visibleClasses = group.classes.filter(
            (className) => !isMobile || className === activeClass
          );
          if (isMobile && visibleClasses.length === 0) return null;

          return (
            <section className={styles.group} key={group.title}>
              <div className={styles.groupHeading}>
                <p>{group.title}</p>
              </div>
              <div className={styles.classGrid}>
                {visibleClasses.map((className) => (
                  <article
                    className={styles.classCard}
                    key={className}
                    ref={(node) => registerClassRef(className, node)}
                  >
                    <div className={styles.classCardHeader}>
                      <h2>{className}</h2>
                    </div>
                    <div className={styles.tableContainer}>
                      {isMobile ? (
                        renderMobileSchedule(className)
                      ) : (
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
                                <th scope="row">
                                  {getTimeLabel(className, time)}
                                </th>
                                {days.map((day) =>
                                  renderTableCell(className, day, time)
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {modalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <header className={styles.modalHeader}>
              <div>
                <p>{selectedCell?.className}</p>
                <h3>
                  {selectedCell?.day} ·{" "}
                  {getTimeLabel(selectedCell?.className, selectedCell?.time)}
                </h3>
              </div>
              <button
                type="button"
                className={styles.textButton}
                onClick={closeModal}
              >
                Închide
              </button>
            </header>

            <form className={styles.modalForm} onSubmit={handleSubmit}>
              <label className={styles.formField}>
                <span>Activitate</span>
                <textarea
                  name="activity"
                  value={formValues.activity}
                  onChange={handleFieldChange}
                  placeholder="ex: Științe - laborator"
                  rows={3}
                />
              </label>

              <label className={styles.formField}>
                <span>Profesor responsabil</span>
                <input
                  type="text"
                  name="professor"
                  value={formValues.professor}
                  onChange={handleFieldChange}
                  placeholder="Nume profesor"
                />
              </label>

              {statusMessage && (
                <p className={styles.formStatus}>{statusMessage}</p>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={handleClearSlot}
                  disabled={saving}
                >
                  Golește
                </button>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={saving}
                >
                  {saving ? "Se salvează..." : "Salvează"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

