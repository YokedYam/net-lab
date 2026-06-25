const ROWS = [
  { cidr: '/25', hostBits: 7, increment: 128, mask: '255.255.255.128', usable: 126 },
  { cidr: '/26', hostBits: 6, increment: 64, mask: '255.255.255.192', usable: 62 },
  { cidr: '/27', hostBits: 5, increment: 32, mask: '255.255.255.224', usable: 30 },
  { cidr: '/28', hostBits: 4, increment: 16, mask: '255.255.255.240', usable: 14 },
  { cidr: '/29', hostBits: 3, increment: 8, mask: '255.255.255.248', usable: 6 },
  { cidr: '/30', hostBits: 2, increment: 4, mask: '255.255.255.252', usable: 2 },
];

export function SubnettingGuide({ onBack }: { onBack?: () => void } = {}) {
  return (
    <div className="study study-pbq">
      <div className="quiz-statusbar">
        <div className="qs-left">
          <span className="qs-domain">Subnetting guide</span>
          <span className="qs-topic"> · /25 through /30</span>
        </div>
        <div className="qs-right">
          {onBack && (
            <button className="btn small" onClick={onBack}>
              Back to PBQs
            </button>
          )}
        </div>
      </div>

      <div className="pbq-card subnet-guide-card">
        <h2 className="pbq-title">Subnetting above /24</h2>
        <p className="pbq-scenario">
          Network+ usually keeps IPv4 subnet math in the class A, B, and C private ranges, then
          asks you to work with prefixes more specific than /24. The shortcut is simple: find the
          host bits, get the increment, then walk the block.
        </p>

        <div className="subnet-credit">
          <span>Video credit</span>
          <a href="https://youtu.be/Glb88drqrOg?si=g0A-AN7Ky1rK9BFn" target="_blank" rel="noreferrer">
            Watch Packetbrew: Subnetting was hard until I learned this shortcut
          </a>
        </div>

        <section className="guide-section">
          <h3>The shortcut</h3>
          <ol className="subnet-steps">
            <li>Subtract the CIDR from 32 to get host bits (32 - 27 = 5).</li>
            <li>Use 2 to that host-bit power to get the increment (2^5 = 32).</li>
            <li>Find the network block the host IP falls inside (.12 falls inside the .0 to .31 block).</li>
            <li>Broadcast is the next block minus 1 (.32 - 1 = .31).</li>
            <li>Usable range is network plus 1 through broadcast minus 1 (.1 through .30).</li>
          </ol>
        </section>

        <section className="guide-section">
          <h3>Memorize this table</h3>
          <div className="subnet-guide-table-wrap">
            <table className="subnet-guide-table">
              <thead>
                <tr>
                  <th>CIDR</th>
                  <th>Host bits</th>
                  <th>Increment</th>
                  <th>Mask</th>
                  <th>Usable IPs</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.cidr}>
                    <td>{row.cidr}</td>
                    <td>{row.hostBits}</td>
                    <td>{row.increment}</td>
                    <td>{row.mask}</td>
                    <td>{row.usable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="guide-example">
          <div className="guide-example-head">
            <span>Example</span>
            <strong>10.29.32.12 /27</strong>
          </div>
          <div className="guide-example-grid">
            <div>
              <span>Host bits</span>
              <b>32 - 27 = 5</b>
            </div>
            <div>
              <span>Increment</span>
              <b>2^5 = 32</b>
            </div>
            <div>
              <span>Network blocks</span>
              <b>.0, .32, .64, .96</b>
            </div>
            <div>
              <span>Host .12 falls in</span>
              <b>10.29.32.0 /27</b>
            </div>
            <div>
              <span>Broadcast</span>
              <b>10.29.32.31</b>
            </div>
            <div>
              <span>Usable range</span>
              <b>10.29.32.1 to 10.29.32.30</b>
            </div>
          </div>
        </section>

        <section className="guide-section">
          <h3>Class A, B, and C examples</h3>
          <div className="class-example-grid">
            <div>
              <span>Class A private style</span>
              <b>10.40.8.77 /26</b>
              <p>Same math. The interesting octet is still the fourth octet for /25 through /30.</p>
            </div>
            <div>
              <span>Class B private style</span>
              <b>172.16.20.130 /28</b>
              <p>The block size is 16. Find the block that contains .130, then subtract 1 for broadcast.</p>
            </div>
            <div>
              <span>Class C private style</span>
              <b>192.168.5.200 /29</b>
              <p>The block size is 8. Blocks are .0, .8, .16, and so on.</p>
            </div>
          </div>
        </section>

        <div className="guide-tip">
          If the question asks for the most efficient subnet, do not start with the IP address. Start
          with the host count. Pick the smallest CIDR that fits, then calculate the network and
          broadcast from the given host IP.
        </div>
      </div>
    </div>
  );
}
