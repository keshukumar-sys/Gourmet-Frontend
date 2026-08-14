import React, { useRef, useEffect, useState } from "react";
import "./MenuCardGenerator.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {useLocation, useNavigate}from "react-router-dom";
import { useParams } from "react-router-dom";


import template1 from "./assets/template1.jpg"
import template2 from "./assets/template2.jpg"

function App() {

  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const incomingMenu =
  location.state?.selectedMenu || {};

  useEffect(() => {

    if (!id) return;

    fetch(`/event/${id}`)
        .then(res => res.json())
        .then(data => {

            setEventDetails(data); // <-- IMPORTANT

            setTemplate(data.template);

            const savedItems = Object.values(
                data.selectedMenu || {}
            ).flat();

            setSelectedItems(savedItems);

        })
        .catch(err => console.log(err));

}, [id]);

  const [eventDetails, setEventDetails] = useState(
  location.state?.eventDetails || null
  );

  const editMode =
  location.state?.editMode || false;

  const templates = {
    template1: {
      img: template1,
      color: "#040404"
    },
    template2: {
      img: template2,
      color: "#040404"
    }
  };

  const [template, setTemplate] = useState("template1");
  const [headingsize, setHeadingsize] = useState("");
  const [headingfont, setHeadingfont] = useState("Poppins");
  const [fontsize, setFontsize] = useState("");
  const [font, setFont] = useState("Poppins");
  const [activeCategory, setActiveCategory] = useState("Oriental Main Course (Vegetarian)");
  const [selectedItems, setSelectedItems] = useState([]);

  const menuData = {
    "Oriental Main Course (Vegetarian)":[ //Done
      "Jasmine rice, green Thai vegetable curry, golden garlic, crisp bean sprout",
      "Teriyaki tofu, burnt garlic sticky rice, wakame sesame cabbage salad",
      "Soba noodles, edamame, tofu, asparagus in light miso broth, spring onion and toasted seaweed",
      "Nasi goreng, baby leek and asparagus skewers, pumpkin chips, peanut dip",
      "Mapo tofu, scallion rice",
      "Stir-fried Asian greens, pandaan rice"
    ],

    "Oriental Main Course (Non-Vegetarian)":[   
      "Red Thai prawn curry, Jasmine rice, golden garlic, crisp bean sprout",
      "Stir-fried grouper in black bean sauce, Jasmine rice",
      "Steamed sea bass with lemon, coriander & garlic, Jasmine rice",
      "Balinese chicken, yellow rice, shallot sambal",
      "Fried chicken, dip",
      "Pork bulgogi, kimchee"
    ],

    "Salads": [ //Done
      "Baby spinach gomae salad with tofu, charcoal corn and togarashi",
      "Warm wild asparagus, sesame, ginger, light soy",
      "Fresh mozzarella, grilled chillies, mint and pine nuts",
      "Black quinoa, mixed herbs, toasted hazelnut, coconut, maple and rice vinegar dressing",
      "Grapefruit, blood orange, pickled ginger, ricotta and romaine",
      "Asparagus, roasted beet root, avocado, mixed greens, citrus Balsamic dressing"
    ],

    "Appetisers (Vegetarian)":[   //Done
      "Brioche baked vada pav",
      "Warm edamame and boiled peanut tarts with togarashi",
      "Avocado pillows, pickled poblano puree",
      "Cream cheese and water chestnut wonton, mango, chilli and coriander",
      "Avocado ceviche, young cucumber, mirin, golden onion",
      "Crisp rice cakes with miso glazed aubergines",
      "Truffle puffs with cheese and chilli bite",
      "Tandoori paneer, coriander pesto filling",
      "Malai paneer tikka, narangi ki chutney",
      "Warm Hormok phak ‘poori’",
      "Wild asparagus tart",
      "Sichuan pepper golden corn nibbles bird’s eye chilli",
      "Mushroom and truffle cream, brittle crisp",
      "Roasted beetroot galouti with feta centre, sheermal",
      "Phyllo wrapped Feta with flavoured honey"
    ],

    "Appetisers (Non-Vegetarian)":[   
      "Creamy chicken and mushroom puff",
      "Keema pav with bacon thecha",
      "Atlantic salmon pillows, pickled poblano puree",
      "Beer batter fried fish fingers, Kaffir lime tartare",
      "Hamachi crudo, green tomato",
      "Dynamite shrimps",
      "Minced prawn balls coated with crisp wanton",
      "Tangra style chilli shrimps with pearl onion",
      "Vietnamese rolls “roast duck with anise”",
      "Murgh ke soole, lehsuni dahi ki chutney",
      "Bhunney murgh ke parchey",
      "Galouti kebab, ulte tawa ka paratha",
      "Mutton boti kebab",
      "Amritsari macchi, hara dhaniya chutney",
      "Butter fly prawn cutlet, kaffir lime, raw mango chutney"
    ],

    "Desserts": [ //Done
      "Sandesh tart",
      "Classic tres leche",
      "Tira mi sui",
      "Gulab jamun cheese cake",
      "Angoori rasmalai",
      "Vanilla bean crème brulee",
      "Zafrani Malpua, laccha rabri",
      "Salted chocolate and caramel tart",
      "Seasonal trifle, olive cake crumble",
      "Ice cream sandwich, hot chocolate sauce, toasted cashew",
      "Mango sticky rice nigiri",
      "Tap tim krob"
    ],

    "Mini Sliders (Vegetarian)":[   //Done
      "Goat cheese and mushroom with arugula",      
      "Edamame, baby spinach, tomato and ricotta",      
      "Roast golden corn, pepper and cashew nut",      
      "Quinoa, parsley and cheese",     
      "Beetroot, potato, and toasted mixed seeds"      
    ],

    "Mini Sliders (Non-Vegetarian)":[  
      "Smoked chicken and jalapeno",
      "Pulled chicken, bar-be-cue sauce",
      "Crisp chicken tenders, caramelised onion",
      "Minced lamb, cheddar",
      "Bull's eye burger, golden onion, chipotle chillies"
    ],

    "Dim Sum In Broth":[  //Done
      "Mushroom and celery in lemongrass broth (V)",
      "Water chestnut and asparagus in superior soy(v)",
      "Prawn and bamboo shoot in kombu dashi stock",
      "Chicken cilantro in superior soy"
    ],

    "Mediterranean Main Course (Vegetarian)":[  //Done
      "Classic hummus, tabouleh, labneh, falafel, pita and olives",
      "Avocado, wild asparagus, parsley, cucumber and jalapeno wraps, pickled vegetables",
      "Fusilli giganti with porcini and morel ragout, pine nuts, Parmesan",
      "Parmesan polenta, grilled winter roots, balsamic tomato",
      "Tomato and curry leaf risotto, goat cheese, sugar snap peas",
      "Cannelloni of roast vegetables, tomato ragout, basil",
      "Grilled corn puree, charred corn, baby leek crisps"
    ],

    "Mediterranean Main Course (Non-Vegetarian)":[ 
      "Pan seared snapper, bisque",
      "Chicken parmigiana",
      "Ham and green pea risotto, Chevre crumble",
      "Braised lamb shank, herb mash",
      "Spaetzle with chicken fricassee",
      "Spaghetti, chorizo and shrimp aglio olio"
    ],

    "Chaats":[  //Done
      "Palak patta aur bhindi ki chaat",
      "Burrata chaat",
      "Mango avocado sev poori",
      "Quinoa and lotus seed bhel",
      "Ram laddoo, laccha mooli, hara chutney",
      "Jhaal moori"
    ],  

    "Quiche (Vegetarian)":[   //Done
      "Wild asparagus and leek",
      "Farmed mushroom, truffle oil",
      "Edamame and water chestnut",
      "Brie and caramelised onion",
      "Broccoli and almond slivers"
    ],

    "Quiche (Non-Vegetarian)":[ 
      "Bacon and onion",
      "Chicken, green onion, cream cheese",
      "Shrimp and garlic, chilli and parmesan",
      "Minced lamb and scarmoza"
    ],

    "Indian Favourites (Vegetarian)":[  //Done
      "Green pea and potato cocktail samosa",
      "Khasta kachouri, saunth chutney",
      "Baked vada pav, thecha",
      "Mixed vegetable cutlet, ketchup sauce"
    ],

    "Wraps and Rolls (Vegetarian)":[  //Done
      "Smashed falafel, haloumi",
      "Cottage cheese chimichurri",
      "Black bean, avocado, chilli pepper wrap",
      "Masala potato, curry leaf, crisp onion"
    ],

    "Wraps and Rolls (Non-Vegetarian)":[  
      "Kolkata chicken kathi roll",
      "Galouti, paratha",
      "Murgh khurchan in roomali",
      "Malabari paratha, mutton ghee roast"
    ],

    "Indian Favourites (Non-Vegetarian)":[ 
      "Chicken/Mutton patti samosa",
      "Chicken cutlet",
      "Masala fish finger, green chilli and peanut dip",
      "Dimer devil, onion- kasundi"
    ],

    "Indian Main Course (Vegetarian)":[   //Done
      "Pulled jackfruit bhuna, kulcha, kheera and cream cheese raita",
      "Malabari paratha tacos, paneer ghee roast, inji puli",
      "Nadru yakhni, doon chetin, Basmati",
      "Smoked tomato makhani with tadka burrata, multigrain paratha",
      "Masala mini kachouri, kadhi, sev aur saunth",
      "Appam/neer dosai, idiyappam, mushroom pepper fry",
      "Khade masaley ka dal, tawa paratha, tadka pyaz",
      "Paneer malai roll with santrey ki chutney"
    ],

    "Indian Main Course (Non-Vegetarian)":[  
      "Rillette of kasha mangsho, luchi, ‘kasundi kachumber",
      "Gobindo bhog” polao, Bhetki macher paturi, khejur-tomato chutney",
      "Kheema ghotala, tikona paratha, hari mirch ka salad",
      "Malabar prawn curry, unpolished rice, mango-ginger relish",
      "Chicken pepper fry, paratha, peanut chutney",
      "Murgh ka khurchan roll",
      "Rawa fried surmai, kasundi onion",
      "Butter garlic prawn, kokum"
    ],

    "The Mediterranean Spread":[    //Done
      "Hummus, butternut squash, arugula, roasted pepper",
      "Mixed berry labneh",
      "Phyllo wrapped feta arugula",
      "Marinated olives, lavache",
      "Preserved lemon and ricotta flat bread",
      "Charred wild mushroom, parmesan, rocket",
      "Baby potatoes, rosemary",
    ],

    "Temari (Vegetarian)":[   //Done
      "Pickled ginger, radish, gochujang",
      "Bell pepper, sesame miso",
      "Zucchini, smoked chilli",
      "Spinach, edamame"
    ],

    "Temari (Non-Vegetarian)":[   
      "Salmon, cream cheese, tobanjan",
      "Spicy tuna",
      "Hamachi, yuzu mayo",
      "Spinach, edamame"
    ],

    "Flatbreads (Vegetarian)":[   //Done
      "Tomato, basil, bocconcini, pinenuts",
      "Smashed avocado, sun-dried tomato, goat cheese, arugula",
      "Wild mushroom, parsley, pearl onion, Parmesan"
    ],

    "Mini Sandwiches (Vegetarian)":[    //Done
      "Cucumber, dill and cream cheese fingers",
      "Spiced bocconcini, slow roasted tomato and basil on focaccia",
      "Mozzarella, Cheddar and green chilli on toast",
      "Goat cheese, avocado, celery, walnut pesto and water cress"
    ],

    "Mini Sandwiches (Non-Vegetarian)":[   
      "Grilled honey glazed ham and cheese",
      "Roast chicken, mustard, red onion, Cheddar",
      "Pulled lamb, cream cheese, jalapeno and romaine",
      "Egg and ‘kasundi’ fingers"
    ],

    "Flatbreads (Non-Vegetarian)":[   
      "Chicken, bacon, red onion, sour cream",
      "Minced lamb, mint, Feta and pine nuts",
      "Pepperoni"
    ],
    
    "Refreshing Thirst Quenchers":[
      "Smoked kairi panna, chilli raw mango",
      "Dhungar masala chaas, methi nimki",
      "Lemongrass and kaffir lime shikanji, chilled pomelo",
      "Pomegranate, dilli “kala chaat” masala",
      "Hazelnut ‘espresso’ cold coffee",
      "Kaffir lime mojito"
    ],

    "The Antipasti Table":[
      "Roasted baby aubergines garlic and feta, chilli and thyme",
      "Zucchini rolls filled with goat cheese and arugula, extra virgin olive oil",
      "Rosemary and chilli marinated olives",
      "Avocado, heirloom tomato and bocconcini",
      "Beetroot and cream cheese spread caraway seeds, lavache",
      "Slow roasted tomato, mozzarella and basil",
      "Grilled peppers marjoram, parmesan",
      "Marinated mixed mushroom tarragon"
    ]
  };

  const handleSelect = (item) => {
  if (selectedItems.includes(item)) {
    setSelectedItems(
      selectedItems.filter((i) => i !== item)
    );
  } else {
    setSelectedItems([
      ...selectedItems,
      item
    ]);
  }
};

  // REPLACE OLD downloadPDF FUNCTION WITH THIS

const downloadPDF = async () => {

  const cards =
    document.querySelectorAll(".template-card");

  const pdf = new jsPDF("p", "mm", "a4");

  for (let i = 0; i < cards.length; i++) {

    const canvas = await html2canvas(cards[i], {
      scale: 3,
      useCORS: true
    });

    const imgData =
      canvas.toDataURL("image/png");

    if (i > 0) {
      pdf.addPage();
    }

    pdf.addImage(
      imgData,
      "PNG",
      0,
      0,
      210,
      297
    );
  }

  pdf.save("MenuCard.pdf");
};

const handlePreview = () => {

  const templateHTML =
  document.querySelector(".templates-wrapper")?.innerHTML;

  sessionStorage.setItem(
    "templateHTML",
    templateHTML
  );

  const selectedMenu = {};

  Object.keys(menuData).forEach((category) => {

    const items = menuData[category].filter((item) =>
      selectedItems.includes(item)
    );

    if (items.length > 0) {
      selectedMenu[category] = items;
    }

  });

  navigate("/summary", {
    state: {
      eventDetails,
      template,
      templateImage: templates[template].img,
      selectedMenu,
      selectedCategories
    }
  });
};

const handleUpdateMenu = async () => {

  const selectedMenu = {};

  Object.keys(menuData).forEach((category) => {

    const items = menuData[category].filter(item =>
      selectedItems.includes(item)
    );

    if (items.length > 0) {
      selectedMenu[category] = items;
    }

  });

  try {

    const response = await fetch(
      `/updateEvent/${id}`,
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
          selectedMenu
        })
      }
    );

    const data = await response.json();

    alert(data.message);

    if (sessionStorage.getItem("adminToken")) {
      navigate("/allEvents");
    } else {
      navigate("/events");
    }

  } catch (err) {

    console.log(err);
    alert("Failed to update menu");

  }
};

  const selectedCategories = Object.keys(menuData).filter(
  (category) =>
    menuData[category].some((item) =>
      selectedItems.includes(item)
    )
);

  const itemFont = fontsize ? `${fontsize}px` : "16px";
  const headerFont = headingsize ? `${headingsize}px` : "30px";



  return (
    <div className="menu-main-container">
      <h1 className="page-title">Catering Menu Card Generator</h1>

      {/* TOP PANEL */}
      <div className="top-panel">

        <div className="control-box control-box-1">
          <label>Select Template</label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          >
            <option value="template1">Template 1</option>
            <option value="template2">Template 2</option>
          </select>
        </div>

        {/* <div className="control-box control-box-2">
          <label>Select Category</label>
          <div className="category-buttons">
            {Object.keys(menuData).map((cat, i) => (
              <button
                key={i}
                className={
                  activeCategory === cat
                    ? "category-btn active-btn"
                    : "category-btn"
                }
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div> */}

        {/* <div className="control-box items-box control-box-3">
          <label className=" text-center pt-2 pb-0">{activeCategory} Items</label>
          <hr />

          {menuData[activeCategory]?.map((item, i) => (
              <div key={i} className="check-row">
                <input
                  className="checkbox"
                  type="checkbox"
                  checked={selectedItems.includes(item)}
                  onChange={() => handleSelect(item)}
                />
                <label>{item}</label>
              </div>
            ))
          }
        </div> */}

        <div className="control-box control-box-4">
          <label>Heading Size</label>
          <input
            type="number"
            min="30" 
            max="40" 
            placeholder="30"
            onChange={(e) => setHeadingsize(e.target.value)}
          />

          <select onChange={(e) => setHeadingfont(e.target.value)}>
            <option value="Poppins">Poppins</option>
            <option value="Roboto">Roboto</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Playfair Display">Playfair</option>
            <option value="Lora">Lora</option>
          </select>
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

          <select onChange={(e) => setFont(e.target.value)}>
            <option value="Poppins">Poppins</option>
            <option value="Roboto">Roboto</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Playfair Display">Playfair</option>
            <option value="Lora">Lora</option>
          </select>
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
        backgroundImage: `url(${templates[template].img})`,
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
                color: templates[template].color,
                fontSize: headerFont,
                fontFamily: headingfont
              }}
            >
              {category}
            </h3>

            

            {menuData[category]
              .filter((item) => selectedItems.includes(item))
              .map((item, i) => (

                <h4
                  key={i}
                  className="menu-items"
                  style={{
                    color: templates[template].color,
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