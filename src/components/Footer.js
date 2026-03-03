// src/components/Footer.js
import React from "react";
import { Link } from "react-router-dom";
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
} from "react-icons/fa";

import "./Footer.css";
function Footer() {
  return (
    <footer className="mt-5">
      <div className="footer-circle"></div>
      <div className="container">
        <div className="row">
          <div className="col-md-4 mb-4">
            <h5 className="text-gold mb-3">
              Faith Foundation International School
            </h5>
            <p className="text-white-50">
              Providing quality education with Nigerian values and global
              standards since 2008.
            </p>
            <div className="social-links">
              <a href="#" className="text-white me-3">
                <FaFacebook size={24} />
              </a>
              <a href="#" className="text-white me-3">
                <FaTwitter size={24} />
              </a>
              <a href="#" className="text-white me-3">
                <FaInstagram size={24} />
              </a>
              <a href="#" className="text-white">
                <FaYoutube size={24} />
              </a>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <h5 className="text-gold mb-3">Quick Links</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/" className="text-white-50">
                  Home
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/students" className="text-white-50">
                  Students
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/search" className="text-white-50">
                  Search
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/statistics" className="text-white-50">
                  Statistics
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-md-4 mb-4">
            <h5 className="text-gold mb-3">Contact Info</h5>
            <ul className="list-unstyled">
              <li className="mb-2 text-white-50">
                <FaMapMarkerAlt className="me-2" />
                12 Bishop Shanahan, Fegge Onitsha, Anambra
              </li>
              <li className="mb-2 text-white-50">
                <FaPhone className="me-2" />
                +234 9030175230
              </li>
              <li className="mb-2 text-white-50">
                <FaEnvelope className="me-2" />
                info@faithfoundation.edu.ng
              </li>
            </ul>
          </div>
        </div>

        <hr className="bg-white" />

        <div className="text-center text-white-50">
          <p className="mb-0">
            &copy; {new Date().getFullYear()} Faith Foundation International
            School. All rights reserved. | Proudly Nigerian
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
