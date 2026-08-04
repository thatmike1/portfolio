import { PRIOR, ROLES } from "../data/experience";
import "./experience.css";

/**
 * the paid half of the site. framed as "things i did for money" so it reads as a
 * counterpart to "things i made" rather than turning the page into a cv —
 * PRODUCT.md's anti-references rule out skills bars and testimonial carousels,
 * not honest work history.
 *
 * the nesting is the point: one contract holding several client builds is what
 * agency work actually looks like, and a flat job list would flatten that out.
 * copy lives in src/data/experience.ts. client names never do.
 */
export function Experience() {
    return (
        <section className="xp" aria-labelledby="xp-heading">
            <div className="container">
                <h2 id="xp-heading">things i did for money</h2>
                <p className="section-sub">
                    two years of contract react, delivered remote. the clients are under nda, the
                    work isn't.
                </p>

                <ol className="xp-list">
                    {ROLES.map((role) => (
                        <li className="xp-role" key={`${role.org}-${role.when}`}>
                            <div className="xp-role-head">
                                <p className="xp-when">{role.when}</p>
                                <h3 className="xp-title">{role.title}</h3>
                                <p className="xp-org">{role.org}</p>
                                {role.note ? <p className="xp-note">{role.note}</p> : null}
                            </div>

                            <div className="xp-role-body">
                                {role.summary ? <p className="xp-summary">{role.summary}</p> : null}
                                {role.body ? <p>{role.body}</p> : null}

                                {role.engagements?.length ? (
                                    <ul className="xp-engagements">
                                        {role.engagements.map((eng) => (
                                            <li className="xp-engagement" key={eng.what}>
                                                <div className="xp-eng-head">
                                                    <h4 className="xp-eng-what">{eng.what}</h4>
                                                    {eng.metric ? (
                                                        <p className="xp-eng-metric">
                                                            {eng.metric}
                                                        </p>
                                                    ) : null}
                                                </div>
                                                <p className="xp-eng-client">{eng.client}</p>
                                                <p className="xp-eng-body">{eng.body}</p>
                                                <p className="xp-eng-stack">{eng.stack}</p>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </div>
                        </li>
                    ))}
                </ol>

                {/* a line, not a row — see the note on PRIOR */}
                <p className="xp-prior">
                    <span className="xp-prior-when">{PRIOR.when}</span>
                    {PRIOR.body}
                </p>

                {/* delete this block and the availability rule in the css to go quiet again */}
                <p className="xp-availability">
                    the atreo contract ends in august 2026, so from september i'm looking — contract
                    or full-time, remote, and happy to talk specifics that aren't on this page.{" "}
                    <a href="mailto:misa.psencik@gmail.com">misa.psencik@gmail.com</a>.
                </p>
            </div>
        </section>
    );
}
