import "./day-job.css";

/** the only public description of the private day-job work, on every page that mentions it */
export const DAY_JOB = "react marketplace mvp for a czech startup";

export function DayJob() {
    return (
        <section className="day-job" id="what-was-mine" aria-labelledby="day-job-heading">
            <div className="container">
                <h2 id="day-job-heading">the day job</h2>
                <p>{DAY_JOB}</p>
            </div>
        </section>
    );
}
