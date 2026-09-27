"use client";
import { useEffect, useMemo, useState } from 'react';
import { Store, UserRound, Package, Wrench, ArrowUpRight, ArrowRight, Leaf, ShieldCheck, Handshake, Sprout } from 'lucide-react';
import { BASE_PATH, asset } from '@/lib/site';

const loanTermRates = [
  { label: '1 Week', weeks: 1, rate: 0.15 },
  { label: '2 Wks', weeks: 2, rate: 0.3 },
  { label: '3 Wks', weeks: 3, rate: 0.45 },
  { label: '4 Wks', weeks: 4, rate: 0.6 },
];

const loanPresets = [100000, 500000, 1000000, 2000000];

export default function Home() {
  const [loanAmount, setLoanAmount] = useState(1000000);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedTerm, setSelectedTerm] = useState(3);

  useEffect(() => {
    const items = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const termInfo = useMemo(
    () => loanTermRates.find((term) => term.weeks === selectedTerm) ?? loanTermRates[0],
    [selectedTerm]
  );

  const interestAmount = Math.round(loanAmount * termInfo.rate);
  const totalRepayment = loanAmount + interestAmount;
  const maxLoan = 2000000;
  const minLoan = 100000;

  return (
    <main id="top">
      <style>{`
        .loan-calculator .calculator-layout { background: #eaf4ff; border-color: #bfdaf5; }
        .loan-calculator .preset { background: #f4f9ff; border-color: #bfdaf5; color: #0f3d7a; }
        .loan-calculator .preset.active { background: #0d4ea2; border-color: #0d4ea2; color: #fff; }
        .loan-calculator .custom-amount { background: #fff; border-color: #bfdaf5; }
        .loan-calculator .custom-amount input { color: #0f3d7a; }
        .loan-calculator .range-input { accent-color: #0d4ea2; }
        .loan-calculator .interest-box { background: #fff; border-color: #bfdaf5; color: #0f3d7a; }
        .loan-calculator .summary-card { background: #0d4ea2; }
        .loan-calculator .custom-amount { min-height: 58px; width: 100%; }
        .loan-calculator .custom-amount input { min-width: 0; width: 100%; }
        .loan-calculator .set-button { background: #f8d75a; color: #103a73; min-width: 72px; }
        .loan-calculator .set-button:hover { background: #e7c43d; }
      `}</style>
      <header className="nav">
        <a className="brand" href="#top">
          <img className="brand-logo" src={asset("/images/logo.png")} alt="Ohio Microfinance Limited logo" />
          <span>
            OHIO
            <small>MICROFINANCE LIMITED</small>
          </span>
        </a>
        <nav>
          <a href="#loans">Our loans</a>
          <a href="#business">For business</a>
          <a href="#how">How it works</a>
          <a href="#calculator">Calculator</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span /> BIG AMBITIONS. PERSONAL SUPPORT.
          </div>
          <h1>
            A little support.
            <br />
            A world of
            <br />
            <em>possibility.</em>
          </h1>
          <p>
            For the business you’re building and the life you’re planning. Take your next step with Ohio
            Microfinance Limited.
          </p>
          <div className="actions">
            <a className="button" href={`${BASE_PATH}/apply/`}>
              Apply for a loan <ArrowUpRight size={19} />
            </a>
            <a className="textlink" href="#loans">
              Explore our loans <ArrowRight size={18} />
            </a>
          </div>
          <div className="hero-note">
            <ShieldCheck size={18} /> Your ambition. A conversation. A way forward.
          </div>
        </div>

        <div className="hero-art">
          <img src={asset("/images/tailor.webp")} alt="Small business owner at work in a tailoring studio" />
          <div className="image-label">
            <span className="label-icon">
              <Sprout />
            </span>
            <div>
              Small beginnings.<strong>Bigger possibilities.</strong>
            </div>
          </div>
          <span className="photo-caption">EVERY NEXT CHAPTER STARTS SOMEWHERE</span>
        </div>
      </section>

      <div className="values">
        <span>
          <Handshake /> People-first lending
        </span>
        <span>
          <Leaf /> Room for your ambitions
        </span>
        <span>
          <ShieldCheck /> A thoughtful application process
        </span>
      </div>

      <section id="calculator" className="loan-calculator reveal">
        <div className="calculator-header">
          <span className="eyebrow">CALCULATOR</span>
          <h2>Calculate Your Loan</h2>
          <p>Estimate your repayment amount easily</p>
        </div>

        <div className="calculator-layout">
          <div className="calculator-panel">
            <div className="field-block">
              <label>Loan Amount (MWK)</label>
              <div className="preset-row">
                {loanPresets.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className={loanAmount === amount ? 'preset active' : 'preset'}
                    onClick={() => {
                      setLoanAmount(amount);
                      setCustomAmount('');
                    }}
                  >
                    {amount >= 1000000 ? `${amount / 1000000}M` : `${Math.round(amount / 1000)}K`}
                  </button>
                ))}
              </div>
              <div className="custom-amount">
                <input
                  type="text"
                  inputMode="numeric"
                  min={minLoan}
                  max={maxLoan}
                  placeholder="Type here..."
                  value={customAmount}
                  onChange={(e) => {
                    const nextValue = e.target.value.replace(/[^0-9]/g, '');
                    setCustomAmount(nextValue);
                    const value = Number(nextValue);
                    if (nextValue && Number.isFinite(value) && value >= minLoan && value <= maxLoan) {
                      setLoanAmount(value);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const value = Number(customAmount);
                    if (Number.isFinite(value) && value >= minLoan && value <= maxLoan) setLoanAmount(value);
                  }}
                  className="set-button"
                >
                  Set
                </button>
              </div>
              <input
                className="range-input"
                type="range"
                min={minLoan}
                max={maxLoan}
                step={1000}
                value={loanAmount}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setLoanAmount(value);
                  setCustomAmount('');
                }}
              />
            </div>

            <div className="field-block">
              <label>Loan Term</label>
              <div className="preset-row term-row">
                {loanTermRates.map((term) => (
                  <button
                    key={term.weeks}
                    type="button"
                    className={selectedTerm === term.weeks ? 'preset term active' : 'preset term'}
                    onClick={() => setSelectedTerm(term.weeks)}
                  >
                    {term.label}
                    <small>{term.rate * 100}%</small>
                  </button>
                ))}
              </div>
              <input
                className="range-input"
                type="range"
                min={1}
                max={4}
                step={1}
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(Number(e.target.value))}
              />
            </div>

            <div className="field-block">
              <label>Interest Rate</label>
              <div className="interest-box">{Math.round(termInfo.rate * 100)}%</div>
            </div>
          </div>

          <aside className="calculator-summary">
            <div className="summary-card">
              <div className="summary-label">Total Repayment</div>
              <div className="summary-total">MWK {totalRepayment.toLocaleString('en-MW')}</div>
              <div className="summary-table">
                <div>
                  <span>Principal</span>
                  <strong>MWK {loanAmount.toLocaleString('en-MW')}</strong>
                </div>
                <div>
                  <span>Interest</span>
                  <strong>MWK {interestAmount.toLocaleString('en-MW')}</strong>
                </div>
                <div>
                  <span>Duration</span>
                  <strong>
                    {termInfo.weeks} Week{termInfo.weeks > 1 ? 's' : ''}
                  </strong>
                </div>
              </div>
              <div className="cta-row">
                <a className="button lime" href={`${BASE_PATH}/apply/?type=personal`}>
                  Apply Personal
                </a>
                <a className="button secondary" href={`${BASE_PATH}/apply/?type=business`}>
                  Apply Business
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section id="loans" className="section reveal">
        <div className="eyebrow">FINANCE FOR YOUR NEXT CHAPTER</div>
        <h2>
          Whatever your next step,<br />
          let’s make it possible.
        </h2>
        <p>
          From an important personal expense to your next business opportunity, start with the loan that fits
          your purpose.
        </p>
        <div className="loan-cards">
          <article className="loan-card">
            <span className="card-icon">
              <UserRound />
            </span>
            <span className="eyebrow">FOR YOU</span>
            <h3>Personal loans</h3>
            <p>
              Move forward with everyday priorities. A school expense, a home repair or an unexpected
              need—tell us what you need to borrow.
            </p>
            <div className="use-tags">
              <span>Education</span>
              <span>Home improvements</span>
              <span>Personal needs</span>
            </div>
            <a className="textlink" href={`${BASE_PATH}/apply/?type=personal`}>
              Apply for a personal loan <ArrowUpRight size={20} />
            </a>
          </article>
          <article className="loan-card business-card">
            <span className="card-icon">
              <Store />
            </span>
            <span className="eyebrow">FOR YOUR BUSINESS</span>
            <h3>Business loans</h3>
            <p>
              You put the work in every day. Explore funding to stock your shelves, invest in equipment or take
              the next step for your business.
            </p>
            <div className="use-tags">
              <span>Stock & supplies</span>
              <span>Equipment</span>
              <span>Growth</span>
            </div>
            <a className="textlink" href={`${BASE_PATH}/apply/?type=business`}>
              Apply for a business loan <ArrowUpRight size={20} />
            </a>
          </article>
        </div>
      </section>

      <section id="business" className="business-section reveal">
        <div className="business-photo">
          <img
            src={asset("/images/grocer.webp")}
            alt="A neighborhood grocery owner surrounded by produce and stocked shelves"
            loading="lazy"
          />
          <span>FOR THE PEOPLE WHO KEEP OUR COMMUNITIES MOVING</span>
        </div>
        <div className="business-copy">
          <div className="eyebrow">BUILT AROUND YOUR AMBITION</div>
          <h2>
            Today, a fuller shelf.<br />
            Tomorrow, a bigger dream.
          </h2>
          <p>
            A growing business needs room to move. A business loan can help turn an opportunity into your next
            chapter.
          </p>
          <div className="business-use">
            <Package />
            <div>
              <strong>Keep your shelves stocked</strong>
              <p>Buy the products and supplies your customers need.</p>
            </div>
          </div>
          <div className="business-use">
            <Wrench />
            <div>
              <strong>Invest in the tools of your trade</strong>
              <p>Explore funding for equipment that supports your work.</p>
            </div>
          </div>
          <a className="button lime" href={`${BASE_PATH}/apply/?type=business`}>
            Start a business application <ArrowUpRight size={19} />
          </a>
        </div>
      </section>

      <section id="how" className="section process reveal">
        <div className="eyebrow">A SIMPLE START</div>
        <h2>Your next step, in three steps.</h2>
        <div className="process-grid">
          <article>
            <span>01</span>
            <h3>Tell us the essentials</h3>
            <p>Choose personal or business, enter your name, phone number and the amount you need.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Add two clear photos</h3>
            <p>Upload your photo and an image of the collateral you would like to offer.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Check and send</h3>
            <p>Review your application and send it for assessment. Keep your reference for follow-up.</p>
          </article>
        </div>
        <p className="terms-note">
          Applications are subject to assessment. Rates, repayment periods and any additional requirements are
          confirmed before a loan agreement.
        </p>
      </section>

      <section className="closing reveal">
        <span className="eyebrow">LET’S START WITH YOU</span>
        <h2>
          Your next chapter<br />
          starts with one small step.
        </h2>
        <a className="button lime" href={`${BASE_PATH}/apply/`}>
          Apply for a loan <ArrowUpRight size={20} />
        </a>
      </section>

      <footer className="site-footer">
        <div className="footer-brand">
          <img className="footer-logo" src={asset("/images/logo.png")} alt="Ohio Microfinance Limited logo" />
          <div className="brand-title">Ohio Microfinance Limited</div>
          <p>Financing today, building tomorrow, changing lives.</p>
          <div className="collateral-badge">
            <span>⚠</span> Collateral is a MUST for all loans
          </div>
        </div>

        <div className="footer-contact">
          <h3>Get in touch</h3>
          <div className="contact-row">
            <span className="contact-icon"><img src={asset("/images/whatsapp.jpeg")} alt="WhatsApp" /></span>
            <div>
              <p>WhatsApp</p>
              <a href="https://wa.me/265993789137" target="_blank" rel="noreferrer">099 378 9137</a>
            </div>
          </div>
          <div className="contact-row">
            <span className="contact-icon">📞</span>
            <div>
              <p>For call</p>
              <a href="tel:0882879647">088 287 9647</a>
            </div>
          </div>
          <div className="contact-row">
            <span className="contact-icon">✉️</span>
            <div>
              <p>Email</p>
              <a href="mailto:ohiomicrofinance@gmail.com">ohiomicrofinance@gmail.com</a>
            </div>
          </div>
          <div className="contact-row">
            <span className="contact-icon location"><img src={asset("/images/location.png")} alt="Location" /></span>
            <div>
              <p>Location</p>
              <span>Zomba, Blantyre, Mzuzu, Lilongwe, Malawi</span>
            </div>
          </div>
        </div>

        <div className="footer-links">
          <h3>Quick links</h3>
          <ul>
            <li>
              <a href="#top">Home</a>
            </li>
            <li>
              <a href="#loans">Features</a>
            </li>
            <li>
              <a href="#calculator">Calculator</a>
            </li>
            <li>
              <a href={`${BASE_PATH}/apply/`}>Apply Now</a>
            </li>
          </ul>
        </div>
      </footer>

      <div className="footer-bottom">© {new Date().getFullYear()} Ohio Microfinance Limited. All rights reserved.</div>
    </main>
  );
}
