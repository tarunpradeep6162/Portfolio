'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface FormData {
  name: string;
  email: string;
  projectType: string;
  message: string;
}

interface FormErrors {
  [key: string]: string;
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    projectType: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.projectType) {
      newErrors.projectType = 'Please select a project type';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setSubmitMessage('Thank you! I\'ll get back to you soon.');
        setFormData({
          name: '',
          email: '',
          projectType: '',
          message: '',
        });
      } else {
        setSubmitStatus('error');
        setSubmitMessage('Failed to send message. Please try again.');
      }
    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage('An error occurred. Please try again.');
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-[var(--ink)] mb-2">
          Name <span className="text-[var(--accent)]">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-4 py-3 bg-[var(--surface-secondary)] border rounded-lg text-[var(--ink)] placeholder-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all ${
            errors.name ? 'border-red-500' : 'border-[var(--line)]'
          }`}
          placeholder="Your name"
          disabled={isSubmitting}
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-[var(--ink)] mb-2">
          Email <span className="text-[var(--accent)]">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-4 py-3 bg-[var(--surface-secondary)] border rounded-lg text-[var(--ink)] placeholder-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all ${
            errors.email ? 'border-red-500' : 'border-[var(--line)]'
          }`}
          placeholder="your.email@example.com"
          disabled={isSubmitting}
        />
        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="projectType" className="block text-sm font-semibold text-[var(--ink)] mb-2">
          Project Type <span className="text-[var(--accent)]">*</span>
        </label>
        <select
          id="projectType"
          name="projectType"
          value={formData.projectType}
          onChange={handleChange}
          className={`w-full px-4 py-3 bg-[var(--surface-secondary)] border rounded-lg text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all ${
            errors.projectType ? 'border-red-500' : 'border-[var(--line)]'
          }`}
          disabled={isSubmitting}
        >
          <option value="">Select a project type</option>
          <option value="infrastructure">Infrastructure Automation</option>
          <option value="cicd">CI/CD Pipeline</option>
          <option value="cloud">Cloud Migration</option>
          <option value="security">Security Architecture</option>
          <option value="performance">Performance Optimization</option>
          <option value="other">Other</option>
        </select>
        {errors.projectType && <p className="mt-1 text-sm text-red-500">{errors.projectType}</p>}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-[var(--ink)] mb-2">
          Message <span className="text-[var(--accent)]">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={6}
          className={`w-full px-4 py-3 bg-[var(--surface-secondary)] border rounded-lg text-[var(--ink)] placeholder-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all resize-none ${
            errors.message ? 'border-red-500' : 'border-[var(--line)]'
          }`}
          placeholder="Describe your infrastructure problem, deployment challenge, or recovery question..."
          disabled={isSubmitting}
        />
        {errors.message && <p className="mt-1 text-sm text-red-500">{errors.message}</p>}
      </div>

      {submitStatus !== 'idle' && (
        <div
          className={`p-4 rounded-lg text-sm font-medium ${
            submitStatus === 'success'
              ? 'bg-green-500/10 text-green-600 border border-green-500/20'
              : 'bg-red-500/10 text-red-600 border border-red-500/20'
          }`}
        >
          {submitMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-3 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>

      <p className="text-xs text-[var(--ink-muted)] text-center">
        I&apos;ll respond within 24 hours during business days.
      </p>
    </form>
  );
}
