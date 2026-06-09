import React, { useState, useEffect, useCallback } from 'react';
import { candidateAPI, scheduleAPI } from './services/api';
import './App.css';

// Import React Icons
import { 
  FaUserPlus, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaUser, 
  FaClock,
  FaEnvelope,
  FaSpinner,
  FaRegCalendar,
  FaUserTie,
  FaBriefcase
} from 'react-icons/fa';

import { 
  MdSchedule, 
  MdAccessTime, 
  MdPersonAdd,
  MdOutlineCalendarToday
} from 'react-icons/md';

import { 
  HiCalendar, 
  HiUserGroup
} from 'react-icons/hi';

import { 
  BsFillCalendarCheckFill, 
  BsPeopleFill
} from 'react-icons/bs';

function App() {
  const [candList, setCandList] = useState([]);
  const [meetingList, setMeetingList] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState('INT001');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState(null);
  const [successText, setSuccessText] = useState(null);
  
  const [newCand, setNewCand] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    skills: '' 
  });
  
  const [newMeeting, setNewMeeting] = useState({ 
    candidateId: '', 
    startTime: '', 
    endTime: '' 
  });

  // Get user's local timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const loadCandidatesData = useCallback(async () => {
    try {
      const response = await candidateAPI.getAll();
      setCandList(response.data.data || []);
    } catch (err) {
      console.log('error:', err);
    }
  }, []);

  const loadMeetingsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await scheduleAPI.getInterviewerSchedule(selectedPerson);
      setMeetingList(response.data.data || []);
    } catch (err) {
      console.log('error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPerson]);

  useEffect(() => {
    loadCandidatesData();
    loadMeetingsData();
  }, [loadCandidatesData, loadMeetingsData]);

  const addNewCandidate = async (e) => {
    e.preventDefault();
    try {
      await candidateAPI.create(newCand);
      setSuccessText('Candidate added successfully!');
      loadCandidatesData();
      setNewCand({ name: '', email: '', phone: '', skills: '' });
      setTimeout(() => setSuccessText(null), 3000);
    } catch (err) {
      setErrorText('Failed to add candidate');
      setTimeout(() => setErrorText(null), 3000);
    }
  };

  const bookInterview = async (e) => {
    e.preventDefault();
    setErrorText(null);
    setSuccessText(null);
    
    try {
      const startUTC = new Date(newMeeting.startTime).toISOString();
      const endUTC = new Date(newMeeting.endTime).toISOString();
      
      await scheduleAPI.schedule({
        candidateId: newMeeting.candidateId,
        interviewerId: selectedPerson,
        startTime: startUTC,
        endTime: endUTC
      });
      
      setSuccessText('Interview scheduled successfully!');
      loadMeetingsData();
      setNewMeeting({ candidateId: '', startTime: '', endTime: '' });
      setTimeout(() => setSuccessText(null), 3000);
    } catch (err) {
      if (err.response?.status === 409) {
        setErrorText(`${err.response.data.message}`);
      } else {
        setErrorText('Failed to schedule interview');
      }
      setTimeout(() => setErrorText(null), 3000);
    }
  };

  const changeStatus = async (meetingId, newStatus) => {
    try {
      await scheduleAPI.updateStatus(meetingId, newStatus);
      loadMeetingsData();
    } catch (err) {
      console.log('error');
    }
  };

  // Convert UTC stored time to LOCAL display time
  const convertUTCToLocal = (utcDateString) => {
    if (!utcDateString) return 'No date';
    const utcDate = new Date(utcDateString);
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return utcDate.toLocaleString(undefined, options);
  };

  // Show date only for grouping
  const getLocalDateOnly = (utcDateString) => {
    if (!utcDateString) return '';
    const utcDate = new Date(utcDateString);
    return utcDate.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Group interviews by local date
  const getGroupedInterviews = () => {
    const groups = {};
    meetingList.forEach(meeting => {
      const localDate = getLocalDateOnly(meeting.startTime);
      if (!groups[localDate]) {
        groups[localDate] = [];
      }
      groups[localDate].push(meeting);
    });
    return groups;
  };

  const groupedInterviews = getGroupedInterviews();

  return (
    <div className="app">
      <header className="header">
        <h1>
          <HiUserGroup size={28} /> 
          Micro-ATS: Smart Interview Scheduler
        </h1>
       
      </header>

      {errorText && (
        <div className="alert error">
          <FaExclamationTriangle size={14} /> {errorText}
        </div>
      )}
      {successText && (
        <div className="alert success">
          <FaCheckCircle size={14} /> {successText}
        </div>
      )}

      <div className="interviewer-selector">
        <label><BsPeopleFill size={16} /> Select Interviewer:</label>
        <select value={selectedPerson} onChange={(e) => setSelectedPerson(e.target.value)}>
          <option value="INT001"><FaUserTie size={12} /> INT001 - Senior Engineer</option>
          <option value="INT002"><FaBriefcase size={12} /> INT002 - Technical Lead</option>
          <option value="INT003"><FaUserTie size={12} /> INT003 - Hiring Manager</option>
        </select>
      </div>

      <div className="dashboard">
        <div className="left-panel">
          {/* Add Candidate Form */}
          <div className="form-card">
            <h3><FaUserPlus size={20} /> Add New Candidate</h3>
            <form onSubmit={addNewCandidate}>
              <input 
                type="text" 
                placeholder="Full Name" 
                value={newCand.name} 
                onChange={(e) => setNewCand({...newCand, name: e.target.value})} 
                required 
              />
              <input 
                type="email" 
                placeholder="Email Address" 
                value={newCand.email} 
                onChange={(e) => setNewCand({...newCand, email: e.target.value})} 
                required 
              />
              <input 
                type="text" 
                placeholder="Phone Number" 
                value={newCand.phone} 
                onChange={(e) => setNewCand({...newCand, phone: e.target.value})} 
              />
              <input 
                type="text" 
                placeholder="Skills (comma separated)" 
                value={newCand.skills} 
                onChange={(e) => setNewCand({...newCand, skills: e.target.value})} 
              />
              <button type="submit">
                <MdPersonAdd size={16} /> Add Candidate
              </button>
            </form>
          </div>

          {/* Schedule Interview Form */}
          <div className="form-card">
            <h3><MdSchedule size={20} /> Schedule Interview</h3>
            <form onSubmit={bookInterview}>
              <select 
                value={newMeeting.candidateId} 
                onChange={(e) => setNewMeeting({...newMeeting, candidateId: e.target.value})} 
                required
              >
                <option value="">Select Candidate</option>
                {candList.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <input 
                type="datetime-local" 
                onChange={(e) => setNewMeeting({...newMeeting, startTime: e.target.value})} 
                required 
              />
              <input 
                type="datetime-local" 
                onChange={(e) => setNewMeeting({...newMeeting, endTime: e.target.value})} 
                required 
              />
              <small className="timezone-hint">
                <MdAccessTime size={10} /> Scheduling in your local timezone: {userTimezone}
              </small>
              <button type="submit">
                <BsFillCalendarCheckFill size={14} /> Schedule Interview
              </button>
            </form>
          </div>
        </div>

        {/* Calendar Display - Shows LOCAL TIME from UTC storage */}
        <div className="right-panel">
          <div className="calendar-container">
            <h2>
              <HiCalendar size={22} /> Calendar - {selectedPerson}
            </h2>
            <div className="timezone-badge">
              <FaClock size={12} /> Times are shown in your local timezone: <strong>{userTimezone}</strong>
            </div>
            
            {isLoading && (
              <div className="loading">
                <FaSpinner className="spinner" /> Loading interviews...
              </div>
            )}
            {!isLoading && meetingList.length === 0 && (
              <div className="no-interviews">
                <FaRegCalendar size={40} />
                <p>No interviews scheduled</p>
                <p>Use the form to schedule an interview</p>
              </div>
            )}
            
            {!isLoading && Object.keys(groupedInterviews).map(date => (
              <div key={date} className="date-group">
                <div className="date-header">
                  <MdOutlineCalendarToday size={14} /> {date}
                </div>
                {groupedInterviews[date].map(meeting => (
                  <div key={meeting._id} className="interview-card">
                    <div className="interview-info">
                      <div className="candidate-name">
                        <FaUser size={12} /> {meeting.candidateId?.name}
                      </div>
                      <div className="interview-time">
                        <FaClock size={10} /> {convertUTCToLocal(meeting.startTime)} → {convertUTCToLocal(meeting.endTime)}
                      </div>
                      <div className="interview-email">
                        <FaEnvelope size={10} /> {meeting.candidateId?.email}
                      </div>
                    </div>
                    <select 
                      value={meeting.status} 
                      onChange={(e) => changeStatus(meeting._id, e.target.value)}
                      className="status-select"
                    >
                      <option value="Applied">Applied</option>
                      <option value="Technical Round">Technical Round</option>
                      <option value="Offered">Offered</option>
                    </select>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;