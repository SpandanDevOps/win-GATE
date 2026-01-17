import React, { useState, useEffect } from 'react';
import { BookOpen, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { curriculumAPI } from '../services/api';
import '../styles/Curriculum.css';

const Curriculum = ({ darkMode }) => {
  const [subject, setSubject] = useState('cs');
  const [expandedSubject, setExpandedSubject] = useState('Engineering Mathematics');
  const [curriculumData, setCurriculumData] = useState({});
  const [syncing, setSyncing] = useState(false);
  const navigate = useNavigate();

  // CS Curriculum Structure
  const curriculumStructure = {
    cs: {
      'Engineering Mathematics': [
        'Discrete Mathematics',
        'Propositional and first-order logic',
        'Sets, relations, and functions',
        'Partial orders and lattices',
        'Monoids, Groups',
        'Counting, recurrence relations, generating functions'
      ],
      'Digital Logic': [
        'Boolean algebra',
        'Combinational and sequential circuits',
        'Minimization',
        'Number representations and computer arithmetic',
        'Representation of negative numbers',
        'Fast adders',
        'Multipliers, code converters'
      ],
      'Computer Organization and Architecture': [
        'Machine instructions and addressing modes',
        'ALU, data-path, and control unit',
        'Instruction pipelining',
        'Memory hierarchy: cache, main memory, secondary storage',
        'I/O interface (Interrupt and DMA mode)'
      ],
      'Programming and Data Structures': [
        'Programming in C',
        'Functions, recursion, parameter passing, scope',
        'Binding of variables',
        'Abstract data types',
        'Stacks, queues, linked lists, trees, binary search trees, heaps, graphs'
      ],
      'Algorithms': [
        'Searching, sorting, hashing',
        'Asymptotic worst and average case time and space complexity',
        'Algorithm design techniques: greedy, dynamic programming, divide-and-conquer',
        'Graph algorithms: DFS, BFS, shortest paths, minimum spanning trees',
        'Pattern matching and parsing'
      ],
      'Theory of Computation': [
        'Regular expressions and finite automata',
        'Context-free grammars and push-down automata',
        'Regular and context-free languages, pumping lemma',
        'Turing machines and undecidability'
      ],
      'Compiler Design': [
        'Lexical analysis, parsing, syntax-directed translation',
        'Runtime environments',
        'Intermediate code generation'
      ],
      'Operating System': [
        'Processes, threads, inter-process communication, synchronization',
        'Deadlock',
        'CPU and I/O scheduling',
        'Memory management and virtual memory',
        'File systems'
      ],
      'Databases': [
        'ER-model',
        'Relational model: relational algebra, tuple calculus',
        'SQL',
        'Integrity constraints, normal forms',
        'File organization, indexing',
        'Transactions and concurrency control'
      ],
      'Computer Networks': [
        'Concept of layering: OSI and TCP/IP stack',
        'Basics of packet, circuit and virtual circuit switching',
        'Data link layer: framing, error detection',
        'MAC addresses, ARP',
        'Intra-routing, inter-routing (distance vector and link state routing)',
        'RIP and OSPF',
        'BGP, IPv4, CIDR notation, Basics of IPv6',
        'IP addressing, static and dynamic address assignment',
        'ICMP',
        'Transport layer: flow control, error control',
        'TCP/UDP and sockets',
        'DNS, SMTP, HTTP, FTP, Email'
      ]
    }
  };

  const subjects = Object.keys(curriculumStructure[subject] || {});
  const totalTopics = subjects.reduce((sum, subj) => sum + curriculumStructure[subject][subj].length, 0);

  useEffect(() => {
    const initData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      await loadCurriculumData();
    };
    initData();
  }, []);

  const loadCurriculumData = async () => {
    try {
      const response = await curriculumAPI.getAll();
      const subjectsArr = response?.data?.subjects || [];
      const dataFromBackend = {};
      subjectsArr.forEach((subjectBlock) => {
        const subj = subjectBlock.subject;
        if (!dataFromBackend[subj]) dataFromBackend[subj] = {};
        (subjectBlock.topics || []).forEach((t) => {
          dataFromBackend[subj][t.topic] = {
            watched: Boolean(t.watched),
            revised: Boolean(t.revised),
            tested: Boolean(t.tested),
          };
        });
      });
      setCurriculumData(dataFromBackend);
      return;
    } catch (error) {
      console.log('Backend load failed:', error);
    }

    setCurriculumData({});
  };

  const toggleTopic = async (subjectName, topic, field) => {
    const current = curriculumData[subjectName]?.[topic]?.[field] || false;
    const newValue = !current;

    const updated = { ...curriculumData };
    if (!updated[subjectName]) updated[subjectName] = {};
    if (!updated[subjectName][topic]) updated[subjectName][topic] = { watched: false, revised: false, tested: false };
    updated[subjectName][topic][field] = newValue;
    
    // Update local state immediately
    setCurriculumData(updated);
    
    // Sync to backend
    setSyncing(true);
    try {
      const topicData = updated[subjectName][topic];
      await curriculumAPI.saveTopic({
        subject: subjectName,
        topic,
        watched: topicData.watched,
        revised: topicData.revised,
        tested: topicData.tested,
      });
    } catch (error) {
      console.error('Error syncing to backend:', error);
    } finally {
      setSyncing(false);
    }
  };

  const getTopicProgress = (subjectName, topic) => {
    const data = curriculumData[subjectName]?.[topic] || { watched: false, revised: false, tested: false };
    return [data.watched, data.revised, data.tested];
  };

  const getSubjectStats = (subjectName) => {
    const topics = curriculumStructure[subject][subjectName] || [];
    const watched = topics.filter(t => curriculumData[subjectName]?.[t]?.watched).length;
    const revised = topics.filter(t => curriculumData[subjectName]?.[t]?.revised).length;
    const tested = topics.filter(t => curriculumData[subjectName]?.[t]?.tested).length;
    return { watched, revised, tested, total: topics.length };
  };

  const stats = {
    lectureWatched: subjects.reduce((sum, s) => sum + getSubjectStats(s).watched, 0),
    notesRevision: subjects.reduce((sum, s) => sum + getSubjectStats(s).revised, 0),
    tested: subjects.reduce((sum, s) => sum + getSubjectStats(s).tested, 0),
  };

  const overallProgress = Math.round((stats.tested / Math.max(totalTopics, 1)) * 100);

  return (
    <div className="curriculum-section">
      {/* Animated Header */}
      <div className="curriculum-header-wrapper">
        <div className="curriculum-header">
          <div className="header-title">
            <h1>Win GATE</h1>
            <div className="moving-text">
              <p>A spandy Initiative for tracking GATE CS exam preparation</p>
            </div>
          </div>
          <div className="header-buttons">
            <button className={`subject-btn ${subject === 'cs' ? 'active' : ''}`} onClick={() => setSubject('cs')}>CS</button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <BookOpen size={28} />
          <div>
            <p className="stat-label">Total Topics</p>
            <p className="stat-value">{totalTopics}</p>
            <p className="stat-desc">Included All Subjects</p>
          </div>
        </div>
        <div className="stat-card">
          <CheckCircle2 size={28} />
          <div>
            <p className="stat-label">Lecture Watched</p>
            <p className="stat-value">{stats.lectureWatched}</p>
            <p className="stat-desc">Topics finished</p>
          </div>
        </div>
        <div className="stat-card">
          <RotateCcw size={28} />
          <div>
            <p className="stat-label">Notes Revision</p>
            <p className="stat-value">{stats.notesRevision}</p>
            <p className="stat-desc">Topics reviewed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="progress-icon">{overallProgress}%</div>
          <div>
            <p className="stat-label">Overall Progress</p>
            <p className="stat-value">{overallProgress}%</p>
            <p className="stat-desc">Tests completed</p>
          </div>
        </div>
      </div>

      {/* Subject Tabs and Topics */}
      <div className="subjects-container">
        <div className="subject-tabs-wrapper">
          <div className="subject-tabs">
            {subjects.map(subj => (
              <button
                key={subj}
                className={`subject-tab ${expandedSubject === subj ? 'active' : ''}`}
                onClick={() => setExpandedSubject(subj)}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        {/* Topics Table */}
        <div className="topics-table-wrapper">
          <table className="topics-table">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Lecture Watched</th>
                <th>Notes Revision</th>
                <th>Test</th>
              </tr>
            </thead>
            <tbody>
              {(curriculumStructure[subject][expandedSubject] || []).map((topic, idx) => {
                const [watched, revised, tested] = getTopicProgress(expandedSubject, topic);
                return (
                  <tr key={idx} className={tested ? 'completed' : ''}>
                    <td className="topic-name">{topic}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={watched}
                        onChange={() => toggleTopic(expandedSubject, topic, 'watched')}
                        className="topic-checkbox"
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={revised}
                        onChange={() => toggleTopic(expandedSubject, topic, 'revised')}
                        className="topic-checkbox"
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={tested}
                        onChange={() => toggleTopic(expandedSubject, topic, 'tested')}
                        className="topic-checkbox"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Curriculum;
