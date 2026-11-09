import type { SetsGuide } from '../../workout/types'

/** The sets guide, closed until tapped so the exercises stay first (ICR-260005). */
export function SetsGuidePanel({ guide }: { readonly guide: SetsGuide }) {
  return (
    <details className="guide">
      <summary className="guide__title">{guide.title}</summary>
      {guide.sections.map((section) => (
        <section key={section.heading} className="guide__section">
          <h2 className="guide__heading">{section.heading}</h2>
          {section.table && (
            <table className="guide__table">
              <thead>
                <tr>
                  {section.table.columns.map((column) => (
                    <th key={column} scope="col">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.table.rows.map((row) => (
                  <tr key={row.join('|')}>
                    {row.map((cell, i) => (i === 0 ? <th key={i} scope="row">{cell}</th> : <td key={i}>{cell}</td>))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {section.items && (
            <ul className="guide__list">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </details>
  )
}
