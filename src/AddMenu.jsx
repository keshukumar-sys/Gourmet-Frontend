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

    const [allMenus, setAllMenus] = useState([]);
    const [selectedMenus, setSelectedMenus] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 10;

    const fetchMenus = async (currentSearch = search) => {
        try {
            const res = await api.get(`/menu/all?page=1&limit=10000&search=${encodeURIComponent(currentSearch)}`);
            if (res.data && res.data.menu) {
                const reversedData = [...res.data.menu].reverse();
                setAllMenus(reversedData);
                setTotalPages(Math.ceil(reversedData.length / limit) || 1);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchMenus(search);
    }, [search]);

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

            let res;
            if (editingId) {
                res = await api.patch(`/menu/patch/${editingId}`, formData);
            } else {
                res = await api.post("/menu/create", formData);
            }

            if (res.data && res.data.success) {
                toast.success(res.data.message || (editingId ? "Menu Updated" : "Menu Added Successfully"));
                setDishName("");
                setDishIngredients("");
                setPrice("");
                setCategory("");
                setIsVeg(true);
                setAllergens("");
                setImages(null);
                setPreviewUrl(null);
                setEditingId(null);
                fetchMenus();
            } else {
                toast.error(res.data.message || (editingId ? "Failed to update menu" : "Failed to add menu"));
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

    const handleEdit = (menu) => {
        setEditingId(menu._id);
        setDishName(menu.dishName);
        setDishIngredients(menu.dishIngredients.join(", "));
        setPrice(menu.price || "");
        setCategory(menu.category);
        setIsVeg(menu.isVeg);
        setAllergens(menu.allergens ? menu.allergens.join(", ") : "");
        setImages(null);
        setPreviewUrl(menu.images && menu.images.length > 0 ? menu.images[0] : null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setDishName("");
        setDishIngredients("");
        setPrice("");
        setCategory("");
        setIsVeg(true);
        setAllergens("");
        setImages(null);
        setPreviewUrl(null);
    };

    return (
        <div className="addmenu-page">
            <div className="addmenu-container">
                <h2 className="addmenu-title">{editingId ? "Edit Menu" : "Add Menu"}</h2>

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
                        placeholder="Price in ₹ (optional)"
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

                    <div style={{ display: 'flex', gap: '10px' }}>
                        {editingId && (
                            <button type="button" className="add-btn" style={{ background: '#6b7280' }} onClick={cancelEdit}>
                                Cancel
                            </button>
                        )}
                        <button type="submit" className="add-btn" disabled={loading} style={{ flex: 1 }}>
                            {loading ? "Saving..." : (editingId ? "Update Menu" : "Add Menu")}
                        </button>
                    </div>
                </form>

                <div className="section-divider"></div>

                <div className="menu-header">
                    <h3 className="text-light">
                        {allMenus.length === 0 ? "No Menus" : "Available Menus"}
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
                    {allMenus.slice((page - 1) * limit, page * limit).map((menu) => (
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p className="menu-veg">{menu.isVeg ? "🟢 Veg" : "🔴 Non-Veg"}</p>
                                {menu.price && <p className="menu-price">₹{menu.price}</p>}
                            </div>
                            <button
                                type="button"
                                className="add-btn"
                                style={{ marginTop: 'auto', padding: '8px', fontSize: '14px', height: 'auto' }}
                                onClick={() => handleEdit(menu)}
                            >
                                Edit
                            </button>
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