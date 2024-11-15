import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-database.js";


const firebaseConfig = {
  apiKey: "AIzaSyDACGqgCvxlNCncb19OcFhrPekgsVswH0c",
  authDomain: "vetmedica-67582.firebaseapp.com",
  databaseURL: "https://vetmedica-67582-default-rtdb.firebaseio.com",
  projectId: "vetmedica-67582",
  storageBucket: "vetmedica-67582.appspot.com",
  messagingSenderId: "189278245149",
  appId: "1:189278245149:web:fcfdbdb7b01c1b8c4351f4",
  measurementId: "G-TNPKG0NZR8"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


(function() {
  emailjs.init("VOC7SB-kqh4F-Q4Bb"); 
})();

const createAppointmentForm = document.getElementById('create-appointment-form');
const appointmentsEl = document.getElementById('appointments');
const downloadBtn = document.getElementById('download-btn');
let appointments = {};
let existingIds = new Set(); 


function generateUniqueId() {
  let id;
  do {
    id = Math.floor(100000 + Math.random() * 900000).toString(); 
  } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}


function renderAppointments() {
  appointmentsEl.innerHTML = ''; 
  Object.keys(appointments).forEach((id) => {
    const appointment = appointments[id];

    if (appointment.status === 'Pending') {
      const appointmentEl = document.createElement('div');
      appointmentEl.classList.add('appointment');

      const idEl = document.createElement('p');
      idEl.innerText = `ID: ${id}`;
      appointmentEl.appendChild(idEl);

      const nameEl = document.createElement('h3');
      nameEl.innerText = appointment.name;
      appointmentEl.appendChild(nameEl);

      const emailEl = document.createElement('p');
      emailEl.innerText = `Email: ${appointment.email}`;
      appointmentEl.appendChild(emailEl);

      const serviceTypeEl = document.createElement('p');
      serviceTypeEl.innerText = `Service Type: ${appointment.serviceType}`;
      appointmentEl.appendChild(serviceTypeEl);

      const dateEl = document.createElement('p');
      dateEl.innerText = `Date: ${appointment.date}`;
      appointmentEl.appendChild(dateEl);

      const timeEl = document.createElement('p');
      timeEl.innerText = `Time: ${appointment.time}`;
      appointmentEl.appendChild(timeEl);

      const statusEl = document.createElement('p');
      statusEl.innerText = `Status: ${appointment.status}`;
      appointmentEl.appendChild(statusEl);

      const approveBtn = document.createElement('button');
      approveBtn.innerText = 'Approve';
      approveBtn.onclick = () => updateAppointmentStatus(id, 'Approved');
      appointmentEl.appendChild(approveBtn);

      const rejectBtn = document.createElement('button');
      rejectBtn.innerText = 'Reject';
      rejectBtn.onclick = () => updateAppointmentStatus(id, 'Rejected');
      appointmentEl.appendChild(rejectBtn);

      appointmentsEl.appendChild(appointmentEl);
    }
  });
}


function updateAppointmentStatus(id, status) {
  const appointmentRef = ref(db, `appointments/${id}`);
  set(appointmentRef, {
    ...appointments[id],
    status: status
  }).then(() => {
    appointments[id].status = status; 
    renderAppointments();

    const appointment = appointments[id];
    emailjs.send("service_e775v0v", "template_x2uooia", {
      to_email: appointment.email,
      to_name: appointment.name,
      appointment_status: status,
      appointment_id: id,
      service_type: appointment.serviceType,
      appointment_date: appointment.date,
      appointment_time: appointment.time,
    }).then((response) => {
      console.log('Status update email sent successfully!', response.status, response.text);
    }).catch((error) => {
      console.error('Failed to send status update email. Error:', error);
    });
  });
}


createAppointmentForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const serviceType = document.getElementById('serviceType').value;
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;

  const appointment = {
    name,
    email,
    serviceType,
    date,
    time,
    status: 'Pending'
  };

  const newId = generateUniqueId();

  const newAppointmentRef = ref(db, `appointments/${newId}`);
  set(newAppointmentRef, appointment).then(() => {
    console.log('Appointment created:', appointment);
    alert('Appointment created successfully!');
    createAppointmentForm.reset();
    
    appointments[newId] = { ...appointment };

    emailjs.send("service_zopqme5", "template_x2uooia", {
      to_email: email,
      to_name: name,
      service_type: serviceType,
      appointment_date: date,
      appointment_time: time,
    }).then((response) => {
      console.log('Email sent successfully!', response.status, response.text);
    }).catch((error) => {
      console.error('Failed to send email. Error:', error);
    });

    renderAppointments();
  });
});

downloadBtn.addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(12);
  doc.text("Appointments", 10, 10);
  doc.setFontSize(10);

  Object.keys(appointments).forEach((id, index) => {
    const appointment = appointments[id];
    doc.text(`ID: ${id}, Name: ${appointment.name}, Email: ${appointment.email}, Service: ${appointment.serviceType}, Date: ${appointment.date}, Time: ${appointment.time}, Status: ${appointment.status}`, 10, 20 + (index * 10));
  });

  doc.save('appointments.pdf');
});

onValue(ref(db, 'appointments'), (snapshot) => {
  const fetchedAppointments = snapshot.val() || {};

  appointments = {};
  existingIds.clear();

  Object.keys(fetchedAppointments).forEach((id) => {
    appointments[id] = fetchedAppointments[id];
    existingIds.add(id);
  });

  renderAppointments();
});

