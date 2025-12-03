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

  const showList = !loading && !error && partners.length > 0;

  return (
    <section className={styles.partnersSection}>
      <div className={styles.partnersHeading}>
        <p>Parteneri & Sponsori</p>
        <h2>Mulțumim partenerilor!</h2>

      </div>

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

      {showList ? (
        <div className={styles.partnersListBlock}>
          <p className={styles.partnersList}>
            {partners.map((partner, index) => {
              const partnerName =
                partner.name?.trim() || "Partener necunoscut";
              return (
                <span
                  key={partner.id ?? `${partnerName}-${index}`}
                  className={styles.partnersListItem}
                >
                  {index > 0 && (
                    <span className={styles.partnersSeparator}>•</span>
                  )}
                  <strong>{partnerName}</strong>
                </span>
              );
            })}
          </p>
        </div>
      ) : (
        !loading &&
        !error && (
          <p className={styles.partnersStatus}>
            Lista de parteneri este în curs de actualizare.
          </p>
        )
      )}
    </section>
  );
}

