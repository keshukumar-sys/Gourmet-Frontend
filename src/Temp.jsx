import React, { useRef, useEffect, useState, useLayoutEffect } from "react";
import "./templateSelection.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {useLocation, useNavigate}from "react-router-dom";
import { useParams } from "react-router-dom";


import template1 from "./assets/template1.jpg"
import template2 from "./assets/template2.jpg"

function App() {

  const location = useLocation();
  const navigate = useNavigate();
  const eventId = location.state?.eventDetails?._id;
  const incomingMenu = location.state?.selectedMenu || {};
  const incomingMenuNotes = location.state?.menuNotes || {};
  const userType = location.state?.userType || "user";
  
  



  useEffect(() => {

    if (!eventId) return;

    fetch(`/event/${eventId}`)
        .then(res => res.json())
        .then(data => {

            setEventDetails(data); // <-- IMPORTANT
            setTemplate(data.template);

        })  
        .catch(err => console.log(err));

}, [eventId]);

  const [eventDetails, setEventDetails] = useState(
  location.state?.eventDetails || null
  );

  const editMode =
  location.state?.editMode || false;

  const [templates, setTemplates] = useState([]);

  useEffect(() => {

    fetch("/templates")
        .then(res => res.json())
        .then(data => {

            setTemplates(data);

            if (data.length > 0) {
                setTemplate(data[0]._id);
            }

        })
        .catch(err => console.log(err));

}, []);

  const [template, setTemplate] = useState("");

  const currentTemplate =
    templates.find(
        temp => temp._id === template
    );

  useEffect(() => {

  if (
    editMode &&
    location.state?.eventDetails?.template
  ) {

    setTemplate(
      location.state.eventDetails.template
    );

  }

}, [editMode, location.state]);


const templateList = templates.map(temp => temp._id);

const prevTemplate = () => {
  const currentIndex = templateList.indexOf(template);

  setTemplate(
    templateList[
      currentIndex === 0
        ? templateList.length - 1
        : currentIndex - 1
    ]
  );
};

const nextTemplate = () => {
  const currentIndex = templateList.indexOf(template);

  setTemplate(
    templateList[
      currentIndex === templateList.length - 1
        ? 0
        : currentIndex + 1
    ]
  );
};

  const [headingsize, setHeadingsize] = useState("");
  const [headingfont, setHeadingfont] = useState("SilkSerif");

const headingFonts = [
  "SilkSerif",
  "Cormorant2"
];

const prevHeadingFont = () => {
  const currentIndex =
    headingFonts.indexOf(headingfont);

  setHeadingfont(
    headingFonts[
      currentIndex === 0
        ? headingFonts.length - 1
        : currentIndex - 1
    ]
  );
};

const nextHeadingFont = () => {
  const currentIndex =
    headingFonts.indexOf(headingfont);

  setHeadingfont(
    headingFonts[
      currentIndex === headingFonts.length - 1
        ? 0
        : currentIndex + 1
    ]
  );
};

  const [fontsize, setFontsize] = useState("");
  const [font, setFont] = useState("Monsterrat");

  const itemFontList = ["Monsterrat", "Futura"];

const prevItemFont = () => {
  const currentIndex = itemFontList.indexOf(font);

  setFont(
    itemFontList[
      currentIndex === 0
        ? itemFontList.length - 1
        : currentIndex - 1
    ]
  );
};

const nextItemFont = () => {
  const currentIndex = itemFontList.indexOf(font);

  setFont(
    itemFontList[
      currentIndex === itemFontList.length - 1
        ? 0
        : currentIndex + 1
    ]
  );
};

const handlePreview = () => {

  const templateHTML =
  document.querySelector(".templates-wrapper")?.innerHTML;

  sessionStorage.setItem(
    "templateHTML",
    templateHTML
  );

  const selectedMenu = incomingMenu;
  const menuNotes = incomingMenuNotes;

  navigate("/summary", {
  state: {
    editMode,
    userType,
    eventDetails,
    template,
    templateImage:currentTemplate?.previewImage,
    selectedMenu,
    menuNotes,
    selectedCategories,
    eventId: eventId
  }
});
};

const handleUpdateMenu = async () => {

  const selectedMenu = incomingMenu;
  const menuNotes = incomingMenuNotes;

  try {

    const response = await fetch(
      `/updateEvent/${eventId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          authorization:
            sessionStorage.getItem("adminToken")||
            sessionStorage.getItem("userToken")
        },
        body: JSON.stringify({
          ...(eventDetails || {}),
          template,
          selectedMenu,
          menuNotes 
        })
      }
    );

    const data = await response.json();

    alert(data.message);

    if (userType === "admin") {
      navigate("/allEvents"); 
    } else {
      navigate("/events");
    }

  } catch (err) {

    console.log(err);
    alert("Failed to update menu");

  }
};

  const selectedCategories = Object.keys(incomingMenu)
  .filter(category => incomingMenu[category]?.length > 0);

  const itemFont = fontsize ? `${fontsize}px` : "16px";
  const headerFont = headingsize ? `${headingsize}px` : "30px";



  return (
    <div className="menu-main-container">
      <h1 className="page-title">Catering Menu Card Generator</h1>

      {/* TOP PANEL */}
      <div className="top-panel">

        <div className="control-box control-box-1">
          <label>Select Template</label>

          <div className="template-carousel">

            <button
              type="button"
              className="arrow-btn"
              onClick={prevTemplate}
            >
              ❮
            </button>

            <div className="template-preview">

                <img
                    src={currentTemplate?.previewImage}
                    alt="template"
                    className="template-thumb"
                />

            <p className="template-name">
                {currentTemplate?.templateName}
            </p>

            </div>

            <button
              type="button"
              className="arrow-btn"
              onClick={nextTemplate}
            >
              ❯
            </button>

          </div>
        </div>

        <div className="control-box control-box-4">
          <label>Heading Size</label>
          <input
            type="number"
            min="30" 
            max="40" 
            placeholder="30"
            onChange={(e) => setHeadingsize(e.target.value)}
          />

          <div className="font-carousel">

          <button
            type="button"
            className="arrow-btn"
            onClick={prevHeadingFont}
          >
            ❮
          </button>

          <div className="font-preview">

            <span
              className="font-name"
              style={{
                fontFamily: headingfont
              }}
            >
              {headingfont === "SilkSerif"
                ? "Silk Serif"
                : "Cormorant"}
            </span>

          </div>

          <button
            type="button"
            className="arrow-btn"
            onClick={nextHeadingFont}
          >
            ❯
          </button>

        </div>
        </div>

        <div className="control-box control-box-5">
          <label>Item Size</label>
          <input
            type="number"
            min="16" 
            max="25" 
            placeholder="16"
            onChange={(e) => setFontsize(e.target.value)}
          />

          <div className="font-carousel">

            <button
              type="button"
              className="arrow-btn"
              onClick={prevItemFont}
            >
              ❮
            </button>

            <div className="font-preview">

              <p
                className="font-name"
                style={{ fontFamily: font }}
              >
                {font === "Monsterrat"
                  ? "Monsterrat"
                  : "Futura"}
              </p>

            </div>

            <button
              type="button"
              className="arrow-btn"
              onClick={nextItemFont}
            >
              ❯
            </button>

          </div>
        </div>

        {/* <button className="download-btn" onClick={downloadPDF}>
          Download PDF
        </button> */}
      </div>

      {/* TEMPLATE AREA */}
      <div className="templates-wrapper">

        {selectedCategories.map((category, index) => (

        <div
            key={index}
            className="template-card"
            style={{
            backgroundImage:`url(${currentTemplate?.previewImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center"
            }}
        >
            <div className="template-content">

            <div className="menu-list">

                <div className="category-section">

                <h3
                    className="menu-heading"
                    style={{
                    color:currentTemplate?.defaultTextColor,
                    fontSize: headerFont,
                    fontFamily: headingfont
                    }}
                >
                    {category}
                </h3>

                {incomingMenu[category]?.map((item, i) => (

                    <h4
                    key={i}
                    className="menu-items"
                    style={{
                        color:currentTemplate?.defaultTextColor,
                        fontSize: itemFont,
                        fontFamily: font
                    }}
                    >
                    • {item}
                    </h4>

                ))}

                </div>

            </div>

            </div>

        </div>

        ))}

</div>

      <div className="preview-btn-div">

          <button
              className="preview-btn btn btn-primary"
              onClick={handlePreview}
          >
              Preview
          </button>

          {editMode && (

              <button
                  className="btn btn-success ms-3"
                  onClick={handleUpdateMenu}
              >
                  Update
              </button>

          )}

      </div>

    </div>
  );
}

export default App;