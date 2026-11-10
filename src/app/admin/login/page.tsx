'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import styles from './page.module.css';
import { AuthCard } from '../../../components/AuthCard';
import { LandingModals } from '../../../components/LandingModals';

export default function AdminLoginPage() {
  const [showRecovery, setShowRecovery] = useState(false);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}><ArrowLeft size={14} />Back to website</Link>
      </header>
      <div className={styles.content}>
        <section className={styles.intro} aria-label="Community quote">
          <span className={styles.quoteMark} aria-hidden="true">“</span>
          <blockquote className={styles.quote}>
            <p><span>What we grow</span><span>today, we share</span><em>tomorrow.</em></p>
          </blockquote>
          <span className={styles.quoteRule} aria-hidden="true" />
        </section>
        <section className={styles.login} aria-label="Administrator sign in">
          <div className={styles.formWrap}>
            <div className={styles.form}><AuthCard embedded premium onForgotPassword={() => setShowRecovery(true)} /></div>
          </div>
        </section>
      </div>
      <LandingModals
        modalType={showRecovery ? 'forgot' : 'none'}
        onClose={() => setShowRecovery(false)}
      />
    </main>
  );
}
