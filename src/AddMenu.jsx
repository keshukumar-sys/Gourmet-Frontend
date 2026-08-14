import React, { useState, useEffect } from "react";
import api, { errorMessage } from "./api";
import { useToast } from "./Toast";
import "./AddMenu.css";

function AddMenu() {
    const toast = useToast();

    const [dishName, setDishName] = useState("");
    const [dishIngredients, setDishIngredients] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("");
    const [isVeg, setIsVeg] = useState(true);
    const [allergens, setAllergens] = useState("");
    const [images, setImages] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const [menus, setMenus] = useState([]);
    const [selectedMenus, setSelectedMenus] = useState([]);
    const [loading, setLoading] = useState(false);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 10;

    const fetchMenus = async (currentPage = 1, currentSearch = search) => {
        try {
            const res = await api.get(`/menu/all?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(currentSearch)}`);
            if (res.data && res.data.menu) {
                setMenus(res.data.menu);
                setTotalPages(res.data.totalPages || 1);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchMenus(page, search);
    }, [page, search]);

    const handleImageChange = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setImages(files);
            setPreviewUrl(URL.createObjectURL(files[0]));
        } else {
            setImages(null);
            setPreviewUrl(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("dishName", dishName);
            formData.append("price", price);
            formData.append("category", category);
            formData.append("isVeg", isVeg);

            const ingredientsArray = dishIngredients.split(",").map(i => i.trim()).filter(i => i);
            if (ingredientsArray.length === 0) {
                toast.error("Please provide at least one ingredient");
                setLoading(false);
                return;
            }
            ingredientsArray.forEach(i => formData.append("dishIngredients", i));

            const allergensArray = allergens.split(",").map(i => i.trim()).filter(i => i);
            if (allergensArray.length > 0) {
                allergensArray.forEach(i => formData.append("allergens", i));
            } else {
                formData.append("allergens", "");
            }

            if (images) {
                for (let i = 0; i < images.length; i++) {
                    formData.append("images", images[i]);
                }
            }

            const res = await api.post("/menu/create", formData);
            if (res.data && res.data.success) {
                toast.success(res.data.message || "Menu Added Successfully");
                setDishName("");
                setDishIngredients("");
                setPrice("");
                setCategory("");
                setIsVeg(true);
                setAllergens("");
                setImages(null);
                setPreviewUrl(null);
                fetchMenus();
            } else {
                toast.error(res.data.message || "Failed to add menu");
            }
        } catch (error) {
            toast.error(errorMessage(error, "Failed to add menu"));
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (id) => {
        setSelectedMenus(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const deleteSelectedMenus = async () => {
        if (!window.confirm("Are you sure you want to delete the selected menus?")) return;
        try {
            let successCount = 0;
            for (const id of selectedMenus) {
                await api.delete(`/menu/delete/${id}`);
                successCount++;
            }
            setSelectedMenus([]);
            fetchMenus();
            toast.success(`Deleted ${successCount} menu item(s)`);
        } catch (error) {
            toast.error(errorMessage(error, "Failed to delete some menus"));
        }
    };

    return (
        <div className="addmenu-page">
            <div className="addmenu-container">
                <h2 className="addmenu-title">Add Menu</h2>

                <form className="addmenu-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Category (e.g. Starters, Main Course)"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    />

                    <input
                        type="text"
                        placeholder="Dish Name"
                        value={dishName}
                        onChange={(e) => setDishName(e.target.value)}
                        required
                    />
                    
                    <input
                        type="text"
                        placeholder="Ingredients (comma separated)"
                        value={dishIngredients}
                        onChange={(e) => setDishIngredients(e.target.value)}
                        required
                    />
                    
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center", alignSelf: "flex-start" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <input
                                type="checkbox"
                                checked={isVeg}
                                onChange={(e) => setIsVeg(e.target.checked)}
                            />
                            Is Vegetarian?
                        </label>
                    </div>
                    
                    <input
                        type="text"
                        placeholder="Allergens (comma separated, optional)"
                        value={allergens}
                        onChange={(e) => setAllergens(e.target.value)}
                    />
                    
                    <input
                        type="number"
                        placeholder="Price (optional)"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />

                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                    />

                    {previewUrl && (
                        <img
                            src={previewUrl}
                            alt="preview"
                            className="preview-img"
                        />
                    )}

                    <button type="submit" className="add-btn" disabled={loading}>
                        {loading ? "Adding..." : "Add Menu"}
                    </button>
                </form>

                <div className="section-divider"></div>

                <div className="menu-header">
                    <h3 className="text-light">
                        {menus.length === 0 ? "No Menus" : "Available Menus"}
                    </h3>

                    <input
                        type="text"
                        placeholder="Search menus..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="menu-search-input"
                    />

                    {selectedMenus.length > 0 && (
                        <button
                            className="delete-btn"
                            onClick={deleteSelectedMenus}
                        >
                            Delete Selected ({selectedMenus.length})
                        </button>
                    )}
                </div>

                <div className="menu-grid">
                    {menus.map((menu) => (
                        <div key={menu._id} className="menu-card">
                            <input
                                type="checkbox"
                                checked={selectedMenus.includes(menu._id)}
                                onChange={() => handleCheckboxChange(menu._id)}
                                className="menu-checkbox"
                            />

                            {menu.images && menu.images.length > 0 ? (
                                <img src={menu.images[0]} alt="menu" />
                            ) : (
                                <div className="no-image-placeholder">No Image</div>
                            )}

                            <h3>{menu.dishName}</h3>
                            <p className="menu-category">{menu.category}</p>
                            <p className="menu-veg">{menu.isVeg ? "🟢 Veg" : "🔴 Non-Veg"}</p>
                            {menu.price && <p className="menu-price">₹{menu.price}</p>}
                        </div>
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="pagination">
                        <button 
                            disabled={page === 1} 
                            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                            className="pagination-btn"
                        >
                            Prev
                        </button>
                        <span className="pagination-info">Page {page} of {totalPages}</span>
                        <button 
                            disabled={page === totalPages} 
                            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                            className="pagination-btn"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AddMenu;