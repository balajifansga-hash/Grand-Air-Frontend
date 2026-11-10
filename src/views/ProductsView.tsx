import React, { useState } from 'react';
import { Product, ProductCategory, ProductStatus } from '../types';
import { StorageService } from '../services/storage';
import { ApiService } from '../services/api';
import { 
  Boxes, 
  Plus, 
  Fan, 
  Edit3, 
  Trash2, 
  X, 
  Factory,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

interface ProductsViewProps {
  products: Product[];
  onProductsUpdated: (updatedProduct?: Product) => void;
  onManufactureProduct: (productId: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onProductsUpdated,
  onManufactureProduct
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [category, setCategory] = useState<ProductCategory>('ceiling_fan');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(2999);
  const [imageUrl, setImageUrl] = useState('');
  const [sweepMm, setSweepMm] = useState<number>(1200);
  const [bladeCount, setBladeCount] = useState<number>(3);
  const [motorType, setMotorType] = useState('BLDC High Efficiency Copper');
  const [rpm, setRpm] = useState<number>(380);
  const [powerWatts, setPowerWatts] = useState<number>(28);
  const [color, setColor] = useState('Matte Black');
  const [warrantyMonths, setWarrantyMonths] = useState<number>(24);

  const resetForm = () => {
    setName('');
    setSku('');
    setModelNumber('');
    setCategory('ceiling_fan');
    setDescription('');
    setPrice(2999);
    setImageUrl('');
    setSweepMm(1200);
    setBladeCount(3);
    setMotorType('BLDC High Efficiency Copper');
    setRpm(380);
    setPowerWatts(28);
    setColor('Matte Black');
    setWarrantyMonths(24);
    setEditingProduct(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setSku(product.sku);
    setModelNumber(product.modelNumber);
    setCategory(product.category);
    setDescription(product.description);
    setPrice(product.price);
    setImageUrl(product.imageUrl);
    setSweepMm(product.specs.sweepMm);
    setBladeCount(product.specs.bladeCount);
    setMotorType(product.specs.motorType);
    setRpm(product.specs.rpm);
    setPowerWatts(product.specs.powerWatts);
    setColor(product.specs.color);
    setWarrantyMonths(product.specs.warrantyMonths);
    setIsAddModalOpen(true);
  };

  const compressImage = (dataUrl: string, maxWidth = 800, maxHeight = 800, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          const compressed = await compressImage(reader.result);
          setImageUrl(compressed);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let finalImageUrl = imageUrl || '/active-air-fan.jpg';
      if (finalImageUrl.startsWith('data:image') && finalImageUrl.length > 50000) {
        finalImageUrl = await compressImage(finalImageUrl);
      }

      const productPayload = {
        name,
        sku: sku || `GA-${category.substring(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`,
        modelNumber: modelNumber || `GA-MODEL-${Date.now().toString().slice(-4)}`,
        category,
        description,
        price: Number(price),
        imageUrl: finalImageUrl,
        specs: {
          sweepMm: Number(sweepMm),
          bladeCount: Number(bladeCount),
          motorType,
          rpm: Number(rpm),
          powerWatts: Number(powerWatts),
          airDeliveryCmm: 220,
          voltage: '220V - 240V ~ 50Hz',
          color,
          hasRemote: false,
          warrantyMonths: Number(warrantyMonths)
        },
        status: 'active' as ProductStatus
      };

      const targetId = editingProduct ? (editingProduct.id || (editingProduct as any)._id) : null;
      let resultingProduct: Product | null = null;

      if (targetId) {
        try {
          if (await ApiService.isBackendOnline()) {
            const apiRes = await ApiService.updateProduct(targetId, productPayload);
            if (apiRes) resultingProduct = apiRes;
          }
        } catch (err) {
          console.warn('API update failed:', err);
        }

        const localRes = StorageService.updateProduct(targetId, productPayload);
        if (!resultingProduct && localRes) {
          resultingProduct = localRes;
        }
        if (!resultingProduct) {
          resultingProduct = {
            ...productPayload,
            id: targetId,
            totalManufactured: editingProduct?.totalManufactured || 0,
            inStock: editingProduct?.inStock || 0,
            createdAt: editingProduct?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
      } else {
        try {
          if (await ApiService.isBackendOnline()) {
            const apiRes = await ApiService.createProduct(productPayload);
            if (apiRes) resultingProduct = apiRes;
          }
        } catch (err) {
          console.warn('API create failed:', err);
        }

        const localRes = StorageService.saveProduct(productPayload);
        if (!resultingProduct && localRes) {
          resultingProduct = localRes;
        }
      }

      setIsAddModalOpen(false);
      resetForm();
      if (resultingProduct) {
        onProductsUpdated(resultingProduct);
      } else {
        onProductsUpdated();
      }
    } catch (err) {
      console.error('Error saving product:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this product from the catalog?')) {
      try {
        if (await ApiService.isBackendOnline()) {
          await ApiService.deleteProduct(id);
        }
      } catch {
        // fallback
      }
      StorageService.deleteProduct(id);
      onProductsUpdated();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Catalog Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <Boxes className="w-4 h-4" />
            <span>Product Master Catalog</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Grand Air Fan Models & Specifications ({products.length})
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your electronics catalog. You can add or update fan models anytime; all specifications 
            are dynamically embedded into generated QR codes.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product Model</span>
        </button>
      </div>

      {/* Product Cards Grid */}
      {products.length === 0 ? (
        <div className="bg-white border-2 border-slate-200 border-dashed rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto text-blue-600">
            <Boxes className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Product Catalog is Clean & Empty</h3>
            <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
              No products in the catalog yet. Click the button below to add your first product model (Ceiling Fan, Table Fan, etc.).
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product Model</span>
            </button>
            <button
              onClick={() => {
                const defaults = StorageService.getProducts();
                if (defaults && defaults.length > 0) {
                  onProductsUpdated(defaults[0]);
                }
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2"
            >
              <Fan className="w-4 h-4 text-blue-600" />
              <span>Load Active Air Fan Models</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const prodId = product.id || (product as any)._id;
            return (
            <div
              key={prodId}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col group"
            >
              {/* Product Image Cover */}
              <div className="h-48 bg-slate-100 relative overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.endsWith('/active-air-fan.jpg')) {
                      target.src = '/active-air-fan.jpg';
                    }
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="bg-white/95 text-blue-700 font-mono text-xs font-bold px-2 py-0.5 rounded border border-blue-200 shadow-sm">
                    {product.sku}
                  </span>
                  <span className="bg-blue-600/90 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow-sm">
                    {product.category.replace('_', ' ')}
                  </span>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(product)}
                    className="p-1.5 bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 rounded-lg border border-slate-200 shadow-sm transition-colors"
                    title="Edit Product"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(prodId)}
                    className="p-1.5 bg-white/95 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-lg border border-slate-200 shadow-sm transition-colors"
                    title="Delete Product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <div className="text-xs font-mono text-slate-300">
                    MODEL: {product.modelNumber}
                  </div>
                  <h3 className="text-base font-bold text-white line-clamp-1">
                    {product.name}
                  </h3>
                </div>
              </div>

              {/* Product Details & Specs */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-slate-600 line-clamp-2">
                  {product.description}
                </p>

                {/* Specs Pills */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Sweep</span>
                    <span className="font-semibold text-slate-800">{product.specs.sweepMm} mm</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Speed</span>
                    <span className="font-semibold text-slate-800">{product.specs.rpm} RPM</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Power</span>
                    <span className="font-mono font-bold text-blue-700">{product.specs.powerWatts}W</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Warranty</span>
                    <span className="font-semibold text-emerald-700">{product.specs.warrantyMonths} Mos</span>
                  </div>
                </div>

                {/* Manufactured Count & Stock */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-500">Total Manufactured: </span>
                    <strong className="text-slate-900 font-mono font-bold">{product.totalManufactured || 0}</strong>
                  </div>
                  <div className="text-blue-700 font-bold font-mono">
                    ₹{product.price.toLocaleString()}
                  </div>
                </div>

                {/* Manufacture Button */}
                <button
                  onClick={() => onManufactureProduct(prodId)}
                  className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs font-bold border border-blue-200 hover:border-blue-600 transition-all flex items-center justify-center gap-2 group-hover:shadow-sm"
                >
                  <Factory className="w-4 h-4" />
                  <span>Manufacture This Model</span>
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div className="flex items-center gap-2 text-blue-600">
                <Fan className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingProduct ? 'Edit Product Model' : 'Add New Electronics Product'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Grand Air Whisper BLDC Ceiling Fan"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="ceiling_fan">Ceiling Fan</option>
                    <option value="table_fan">Table Fan</option>
                    <option value="pedestal_fan">Pedestal Fan</option>
                    <option value="exhaust_fan">Exhaust Fan</option>
                    <option value="wall_fan">Wall Mount Fan</option>
                    <option value="industrial_fan">Industrial Fan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. GA-CF-AURA1200"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Model Number</label>
                  <input
                    type="text"
                    value={modelNumber}
                    onChange={(e) => setModelNumber(e.target.value)}
                    placeholder="e.g. GA-2026-AURA"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Sweep Diameter (mm)</label>
                  <input
                    type="number"
                    value={sweepMm}
                    onChange={(e) => setSweepMm(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Speed (RPM)</label>
                  <input
                    type="number"
                    value={rpm}
                    onChange={(e) => setRpm(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Power Rating (Watts)</label>
                  <input
                    type="number"
                    value={powerWatts}
                    onChange={(e) => setPowerWatts(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Color / Finish</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Warranty Period (Months)</label>
                  <input
                    type="number"
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                  <span>Product Image</span>
                  <span className="text-[11px] text-slate-500 font-normal">JPG, PNG, WebP supported</span>
                </label>
                
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs transition-colors shadow-sm whitespace-nowrap">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>Upload Image from PC</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-slate-400 text-xs font-semibold text-center hidden sm:inline">OR</span>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Paste image URL (https://... or /active-air-fan.jpg)"
                    className="flex-1 w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                {/* Live Preview Box */}
                {imageUrl && (
                  <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-200 shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="flex-1 text-[11px] text-slate-600 overflow-hidden">
                      <span className="font-semibold text-slate-800 block">Image Selected & Ready</span>
                      <span className="text-slate-400 font-mono truncate block">
                        {imageUrl.startsWith('data:') ? 'Local Image File (Base64 ready)' : imageUrl}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded hover:bg-rose-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? 'Saving Changes...' : (editingProduct ? 'Save Changes' : 'Create Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
