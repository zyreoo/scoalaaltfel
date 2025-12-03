"use client";

import { useEffect, useState } from "react";
import styles from "../app/page.module.css";

const initialState = {
  partners: [],
  loading: true,
  error: null,
};

export default function PartnersSection() {
  const [partners, setPartners] = useState(initialState.partners);
  const [loading, setLoading] = useState(initialState.loading);
  const [error, setError] = useState(initialState.error);
  const [newPartnerName, setNewPartnerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    void loadPartners();
  }, []);

  function sortPartners(list = []) {
    return [...list].sort((a, b) => {
      const aName = a?.name?.toString().trim() || "";
      const bName = b?.name?.toString().trim() || "";
      return aName.localeCompare(bName, "ro", { sensitivity: "base" });
    });
  }

  async function loadPartners() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/partners", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Nu am putut încărca partenerii.");
      }

      const payload = await response.json();
      const list = Array.isArray(payload.partners) ? payload.partners : [];
      setPartners(sortPartners(list));
    } catch (err) {
      setPartners([]);
      setError(err.message || "A apărut o eroare.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPartner(event) {
    event.preventDefault();
    const trimmedName = newPartnerName.trim();
    if (!trimmedName) {
      setFormFeedback({
        type: "error",
        text: "Introdu un nume înainte de a salva.",
      });
      return;
    }

    try {
      setSubmitting(true);
      setFormFeedback(null);
      const response = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "Nu am putut adăuga partenerul.");
      }

      const partner =
        payload?.partner && typeof payload.partner === "object"
          ? payload.partner
          : { id: `${trimmedName}-${Date.now()}`, name: trimmedName };

      setPartners((prev) => sortPartners([...(prev ?? []), partner]));
      setNewPartnerName("");
      setFormFeedback({
        type: "success",
        text: "Partener adăugat.",
      });
    } catch (err) {
      setFormFeedback({
        type: "error",
        text: err.message || "A apărut o eroare.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleNameChange(event) {
    setNewPartnerName(event.target.value);
    if (formFeedback?.type === "error") {
      setFormFeedback(null);
    }
  }

  async function handleDeletePartner(partnerId) {
    if (!partnerId) return;
    try {
      setDeletingId(partnerId);
      const response = await fetch("/api/partners", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: partnerId }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Nu am putut șterge partenerul.");
      }

      setPartners((prev) => prev.filter((partner) => partner.id !== partnerId));
    } catch (err) {
      setFormFeedback({
        type: "error",
        text: err.message || "A apărut o eroare la ștergere.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  const showGrid = !loading && !error && partners.length > 0;

  return (
    <section className={styles.partnersSection}>
      <div className={styles.partnersHeading}>
        <p>Parteneri & Sponsori</p>
        <h2>Mulțumim partenerilor!</h2>
      </div>

      <form className={styles.partnersForm} onSubmit={handleAddPartner}>
        <label htmlFor="partner-name-input">Adaugă un partener</label>
        <div className={styles.partnersFormControls}>
          <input
            id="partner-name-input"
            type="text"
            placeholder="ex: Fundația Viitor"
            value={newPartnerName}
            onChange={handleNameChange}
            className={styles.partnersInput}
            disabled={submitting}
          />
          <button
            type="submit"
            className={styles.partnersSubmit}
            disabled={submitting}
          >
            {submitting ? "Se adaugă..." : "Adaugă"}
          </button>
        </div>
        <p className={styles.partnersHint}>
          Completează numele, apoi apasă Adaugă.
        </p>
        {formFeedback && (
          <p
            className={`${styles.partnersFormStatus} ${
              formFeedback.type === "error"
                ? styles.partnersFormStatusError
                : styles.partnersFormStatusSuccess
            }`}
            role={formFeedback.type === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            {formFeedback.text}
          </p>
        )}
      </form>

      {loading && (
        <p className={styles.partnersStatus} role="status">
          Se încarcă partenerii...
        </p>
      )}

      {error && !loading && (
        <div className={styles.partnersStatus} role="alert">
          <p>{error}</p>
          <button type="button" onClick={loadPartners}>
            Reîncarcă
          </button>
        </div>
      )}

      {showGrid ? (
        <ul className={styles.partnersGrid}>
          {partners.map((partner, index) => {
            const partnerName =
              partner.name?.trim() || "Partener necunoscut";
            return (
              <li
                key={partner.id ?? `${partnerName}-${index}`}
                className={styles.partnerCard}
              >
                <span>{partnerName}</span>
                <button
                  type="button"
                  className={styles.partnerDeleteButton}
                  onClick={() => handleDeletePartner(partner.id)}
                  disabled={deletingId === partner.id}
                  aria-label={`Șterge partenerul ${partnerName}`}
                >
                  {deletingId === partner.id ? "…" : "×"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        !loading &&
        !error && (
          <p className={styles.partnersStatus}>
            Încă nu au fost adăugați parteneri.
          </p>
        )
      )}
    </section>
  );
}

