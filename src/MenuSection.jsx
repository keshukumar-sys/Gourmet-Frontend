import "./MenuSection.css";
import React from "react";

export default function Menu() {

  const menuData = {
    "Oriental Main Course (Vegetarian)":[ //Done
      "Jasmine rice, green Thai vegetable curry, golden garlic, crisp bean sprout",
      "Teriyaki tofu, burnt garlic sticky rice, wakame sesame cabbage salad",
      "Soba noodles, edamame, tofu, asparagus in light miso broth, spring onion and toasted seaweed",
      "Nasi goreng, baby leek and asparagus skewers, pumpkin chips, peanut dip",
      "Mapo tofu, scallion rice",
      "Stir-fried Asian greens, pandaan rice"
    ],

    "Oriental Main Course (Non-Vegetarian)":[   //Done
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

    "Appetisers (Non-Vegetarian)":[   //Done
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
      "Angoori rasmalai",
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

    "Mini Sliders (Non-Vegetarian)":[   //Done
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

    "Mediterranean Main Course (Non-Vegetarian)":[  //Done
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

    "Quiche (Non-Vegetarian)":[  //Done
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

    "Wraps and Rolls (Non-Vegetarian)":[  //Done
      "Kolkata chicken kathi roll",
      "Galouti, paratha",
      "Murgh khurchan in roomali",
      "Malabari paratha, mutton ghee roast"
    ],

    "Indian Favourites (Non-Vegetarian)":[  //Done
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

    "Indian Main Course (Non-Vegetarian)":[   //Done
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

    "Temari (Non-Vegetarian)":[   //Done
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

    "Mini Sandwiches (Non-Vegetarian)":[    //Done
      "Grilled honey glazed ham and cheese",
      "Roast chicken, mustard, red onion, Cheddar",
      "Pulled lamb, cream cheese, jalapeno and romaine",
      "Egg and ‘kasundi’ fingers"
    ],

    "Flatbreads (Non-Vegetarian)":[   //Done
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
    ],

    "The Grazing Table":[
      "Locally produced and critically acclaimed cheese platter. Features an artisanal selection of five cheese varieties served with crackers, unpitted olives, grapes, walnuts, apricots and a trio of homemade preserves: fig & rosemary, apple & tomato and orange & kaffir lime."
    ],

    "Hi-Tea":[

      "Our menu starts for a minimum of 15 guests. We offer two cold refreshing beverages, eight curated delicacies and four desserts along with choice of tea/coffee and cookies"
    ],
  };

  return (
    <div className="menu-container">

      <h1 className="menu-title">Our Menu</h1>

      <div className="menu-grid">

        {Object.entries(menuData).map(([category, items], index) => (
          <div key={index} className="menu-card">

            <h2 className="menus-heading">{category}</h2>

            <ul>
              {items.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>

          </div>
        ))}

      </div>

    </div>
  );
}