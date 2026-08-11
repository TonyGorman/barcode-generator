import * as React from 'react'
import shellStyles from './FormShell.module.css'

type FormSectionProps = {
  title: string
  children: React.ReactNode
}

const FormSection: React.FC<FormSectionProps> = ({ title, children }) => (
  <section className={shellStyles.sectionBox}>
    <h2 className={shellStyles.sectionTitle}>{title}</h2>
    {children}
  </section>
)

export default FormSection
