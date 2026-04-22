'use client';

import { FormEvent, useState } from 'react';

export function BriefForm() {
  const [status, setStatus] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const brand = String(formData.get('brand') ?? '').trim();
    const objective = String(formData.get('objective') ?? '').trim();

    if (!brand || !objective) {
      setStatus('Please provide both the brand and objective.');
      return;
    }

    setStatus(`Brief saved for ${brand}. We will optimize for: ${objective}.`);
    form.reset();
  };

  return (
    <section className="brief">
      <h2>Create a direction brief</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Brand name
          <input type="text" name="brand" placeholder="e.g. Northline" />
        </label>
        <label>
          Campaign objective
          <textarea name="objective" placeholder="Describe vibe, audience, and KPIs." />
        </label>
        <button type="submit">Save brief</button>
      </form>
      {status && <p className="status">{status}</p>}
    </section>
  );
}
