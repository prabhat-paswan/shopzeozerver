import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Download, 
  Search, 
  Filter,
  FileText,
  Image as ImageIcon,
  Package
} from 'lucide-react';
import { generateCSVTemplate } from '@/utils/csvTemplate';

interface Product {
  id?: string;
  product_code: string;
  amazon_asin: string;
  sku_id: string;
  name: string;
  description: string;
  selling_price: number;
  mrp: number;
  cost_price: number;
  quantity: number;
  packaging_length: number;
  packaging_breadth: number;
  packaging_height: number;
  packaging_weight: number;
  gst_percentage: number;
  image_1: string;
  image_2: string;
  image_3: string;
  image_4: string;
  image_5: string;
  image_6: string;
  image_7: string;
  image_8: string;
  image_9: string;
  image_10: string;
  video_1: string;
  video_2: string;
  size_chart: string;
  product_type: string;
  size: string;
  colour: string;
  return_exchange_condition: string;
  hsn_code: string;
  custom_attributes: string;
  is_active: boolean;
  is_featured: boolean;
  store_id: number;
  category_id: number;
  sub_category_id: number;
  created_at?: string;
  updated_at?: string;
}

interface Category {
  id: number;
  name: string;
}

interface SubCategory {
  id: number;
  name: string;
  category_id: number;
}

interface Store {
  id: number;
  name: string;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [selectedStore, setSelectedStore] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from backend API
  useEffect(() => {
    const loadAllData = async () => {
      setIsDataLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchCategories(),
          fetchSubCategories(),
          fetchStores(),
          fetchProducts()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data. Please refresh the page.');
      } finally {
        setIsDataLoading(false);
      }
    };

    loadAllData();
  }, []);

  // Monitor csvFile state changes
  useEffect(() => {
    console.log('🔄 csvFile state changed:', csvFile ? `${csvFile.name} (${csvFile.size} bytes)` : 'No file');
  }, [csvFile]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories');
      if (response.ok) {
        const data = await response.json();
        console.log('Categories response:', data);
        setCategories(data.data?.categories || []);
      } else {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/subcategories');
      if (response.ok) {
        const data = await response.json();
        console.log('Subcategories response:', data);
        setSubCategories(data.data?.subCategories || []);
      } else {
        throw new Error(`Failed to fetch subcategories: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setError('Failed to load subcategories');
    }
  };

  const fetchStores = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/stores');
      if (response.ok) {
        const data = await response.json();
        console.log('Stores response:', data);
        setStores(data.data?.stores || []);
      } else {
        throw new Error(`Failed to fetch stores: ${response.status}`);
      }
    } catch (error) {
              console.error('Error fetching stores:', error);
        setError('Failed to load stores');
      }
    };

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      if (response.ok) {
        const data = await response.json();
        console.log('Products response:', data);
        setProducts(data.products || []);
      } else {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    }
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        const response = await fetch(`http://localhost:5000/api/products/${id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setProducts(products.filter(p => p.id !== id));
          
          // Show success message
          const successMessage = document.createElement('div');
          successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
          successMessage.textContent = 'Product deleted successfully!';
          document.body.appendChild(successMessage);
          setTimeout(() => document.body.removeChild(successMessage), 3000);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete product');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        
        // Show error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        errorMessage.textContent = `Error: ${error instanceof Error ? error.message : 'Failed to delete product'}`;
        document.body.appendChild(errorMessage);
        setTimeout(() => document.body.removeChild(errorMessage), 5000);
      }
    }
  };

  const handleSaveProduct = async (productData: Product) => {
    try {
      console.log('=== SAVING PRODUCT ===');
      console.log('Product data to save:', productData);
      console.log('Is editing:', !!editingProduct);
      
      if (editingProduct) {
        // Update existing product
        console.log('Updating product with ID:', editingProduct.id);
        const response = await fetch(`http://localhost:5000/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        });
        
        console.log('Update response status:', response.status);
        
        if (response.ok) {
          const updatedProduct = await response.json();
          console.log('Update response:', updatedProduct);
          
          setProducts(products.map(p => 
            p.id === editingProduct.id ? updatedProduct.product : p
          ));
          
          // Show success message
          const successMessage = document.createElement('div');
          successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
          successMessage.textContent = 'Product updated successfully!';
          document.body.appendChild(successMessage);
          setTimeout(() => document.body.removeChild(successMessage), 3000);
        } else {
          const errorData = await response.json();
          console.error('Update failed:', errorData);
          throw new Error(errorData.message || 'Failed to update product');
        }
      } else {
        // Create new product
        console.log('Creating new product');
        const response = await fetch('http://localhost:5000/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        });
        
        console.log('Create response status:', response.status);
        
        if (response.ok) {
          const newProduct = await response.json();
          console.log('Create response:', newProduct);
          
          setProducts([...products, newProduct.product]);
          
          // Show success message
          const successMessage = document.createElement('div');
          successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
          successMessage.textContent = 'Product created successfully!';
          document.body.appendChild(successMessage);
          setTimeout(() => document.body.removeChild(successMessage), 3000);
        } else {
          const errorData = await response.json();
          console.error('Create failed:', errorData);
          throw new Error(errorData.message || 'Failed to create product');
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving product:', error);
      
      // Show error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      errorMessage.textContent = `Error: ${error instanceof Error ? error.message : 'Failed to save product'}`;
      document.body.appendChild(errorMessage);
      setTimeout(() => document.body.removeChild(errorMessage), 5000);
    }
  };

  const downloadCsvTemplate = () => {
    const headers = [
      'product_code',
      'amazon_asin',
      'sku_id',
      'name',
      'description',
      'selling_price',
      'mrp',
      'cost_price',
      'quantity',
      'packaging_length',
      'packaging_breadth',
      'packaging_height',
      'packaging_weight',
      'gst_percentage',
      'image_1',
      'image_2',
      'image_3',
      'image_4',
      'image_5',
      'image_6',
      'image_7',
      'image_8',
      'image_9',
      'image_10',
      'video_1',
      'video_2',
      'size_chart',
      'product_type',
      'size',
      'colour',
      'return_exchange_condition',
      'hsn_code',
      'custom_attributes',
      'is_active',
      'is_featured',
      'store_id',
      'category_id',
      'sub_category_id'
    ];
    
    const sampleData = [
      'PROD001',
      'B08N5WRWNW',
      'SKU001',
      'Sample Product',
      'This is a sample product description',
      '999.99',
      '1199.99',
      '800.00',
      '50',
      '15.0',
      '7.5',
      '0.8',
      '189',
      '18',
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'https://example.com/video1.mp4',
      '',
      'https://example.com/sizechart.jpg',
      'Electronics',
      'Standard',
      'Black',
      '7 days return policy',
      '8517',
      '{"feature1": "value1", "feature2": "value2"}',
      'true',
      'false',
      '1',
      '1',
      '1'
    ];
    
    const csvContent = [headers.join(','), sampleData.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      alert('Please select a CSV file first!');
      return;
    }
    
    console.log('Starting CSV upload with file:', csvFile.name, csvFile.size);
    setIsLoading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('csv', csvFile);
      
      console.log('Sending request to:', 'http://localhost:5000/api/products/bulk-upload');
      
      const response = await fetch('http://localhost:5000/api/products/bulk-upload', {
        method: 'POST',
        body: formData,
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Upload result:', result);
        
        if (result.errors && result.errors.length > 0) {
          // Show detailed error messages
          const errorMessage = `CSV Upload completed with ${result.errorCount} errors:\n\n${result.errors.slice(0, 10).join('\n')}${result.errors.length > 10 ? '\n\n... and ' + (result.errors.length - 10) + ' more errors' : ''}`;
          alert(errorMessage);
        } else {
          alert(`Successfully uploaded ${result.uploaded} products!`);
        }
        
        // Refresh the products list
        fetchProducts();
        
        setIsUploadModalOpen(false);
        setCsvFile(null);
        setUploadProgress(0);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload CSV');
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error uploading CSV: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    generateCSVTemplate();
  };

  const handleFileSelect = (file: File | null) => {
    console.log('=== FILE SELECTION HANDLER ===');
    console.log('Previous csvFile state:', csvFile);
    console.log('New file to set:', file ? `${file.name} (${file.size} bytes)` : 'No file');
    
    setCsvFile(file);
    
    // Force a re-render to see the state change
    setTimeout(() => {
      console.log('csvFile state after update:', csvFile);
      console.log('Current csvFile state (from closure):', file);
    }, 100);
    
    console.log('=== END FILE SELECTION HANDLER ===');
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || product.category_id === selectedCategory;
    const matchesStore = selectedStore === '' || product.store_id === selectedStore;
    
    return matchesSearch && matchesCategory && matchesStore;
  });

  // Show loading state
  if (isDataLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Data</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600">Manage your product catalog and inventory</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => {
              setIsDataLoading(true);
              fetchProducts();
              setIsDataLoading(false);
            }} 
            variant="outline"
            disabled={isDataLoading}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
          <Button onClick={downloadCsvTemplate} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          <Button onClick={() => setIsUploadModalOpen(true)} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button onClick={handleCreateProduct}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : '')}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="store">Store</Label>
              <select
                id="store"
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value ? Number(e.target.value) : '')}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Stores</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Product</th>
                  <th className="text-left p-3">Code/SKU</th>
                  <th className="text-left p-3">Price</th>
                  <th className="text-left p-3">Stock</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Store</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
                             <tbody>
                 {filteredProducts.length === 0 ? (
                   <tr>
                     <td colSpan={8} className="p-8 text-center">
                       <div className="text-gray-500">
                         <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                         <h3 className="text-lg font-medium mb-2">No products found</h3>
                         <p className="mb-4">
                           {searchTerm || selectedCategory || selectedStore 
                             ? 'Try adjusting your search or filters'
                             : 'Get started by adding your first product'
                           }
                         </p>
                         {!searchTerm && !selectedCategory && !selectedStore && (
                           <Button onClick={handleCreateProduct} size="sm">
                             <Plus className="w-4 h-4 mr-2" />
                             Add Your First Product
                           </Button>
                         )}
                       </div>
                     </td>
                   </tr>
                 ) : (
                   filteredProducts.map((product) => (
                     <tr key={product.id} className="border-b hover:bg-gray-50">
                       <td className="p-3">
                         <div className="flex items-center space-x-3">
                           <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                             {product.image_1 ? (
                               <img src={product.image_1} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                             ) : (
                               <ImageIcon className="w-6 h-6 text-gray-400" />
                             )}
                           </div>
                           <div>
                             <div className="font-medium text-gray-900">{product.name}</div>
                             <div className="text-sm text-gray-500">{product.product_type}</div>
                           </div>
                         </div>
                       </td>
                       <td className="p-3">
                         <div className="space-y-1">
                           <div className="text-sm font-medium">{product.product_code}</div>
                           <div className="text-xs text-gray-500">{product.sku_id}</div>
                         </div>
                       </td>
                       <td className="p-3">
                         <div className="space-y-1">
                           <div className="font-medium text-green-600">₹{product.selling_price}</div>
                           <div className="text-sm text-gray-500 line-through">₹{product.mrp}</div>
                         </div>
                       </td>
                       <td className="p-3">
                         <Badge variant={product.quantity > 0 ? "default" : "destructive"}>
                           {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
                         </Badge>
                       </td>
                       <td className="p-3">
                         <div className="text-sm">
                           {categories.find(c => c.id === product.category_id)?.name || 'Unknown'} / 
                           {subCategories.find(sc => sc.id === product.sub_category_id)?.name || 'Unknown'}
                         </div>
                       </td>
                       <td className="p-3">
                         <div className="text-sm text-gray-600">
                           {stores.find(s => s.id === product.store_id)?.name || 'Unknown'}
                         </div>
                       </td>
                       <td className="p-3">
                         <div className="flex space-x-2">
                           <Badge variant={product.is_active ? "default" : "secondary"}>
                             {product.is_active ? 'Active' : 'Inactive'}
                           </Badge>
                           {product.is_featured && (
                             <Badge variant="outline">Featured</Badge>
                           )}
                         </div>
                       </td>
                       <td className="p-3">
                         <div className="flex space-x-2">
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleEditProduct(product)}
                           >
                             <Edit className="w-4 h-4" />
                           </Button>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleDeleteProduct(product.id!)}
                           >
                             <Trash2 className="w-4 h-4" />
                           </Button>
                         </div>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Product Modal */}
      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          subCategories={subCategories}
          stores={stores}
          onSave={handleSaveProduct}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* CSV Upload Modal */}
      {isUploadModalOpen && (
        <CsvUploadModal
          key={`upload-modal-${csvFile ? csvFile.name : 'no-file'}`}
          onUpload={handleCsvUpload}
          onClose={() => setIsUploadModalOpen(false)}
          isLoading={isLoading}
          progress={uploadProgress}
          csvFile={csvFile}
          onFileSelect={handleFileSelect}
          onDownloadTemplate={handleDownloadTemplate}
        />
      )}
    </div>
  );
};

// Product Modal Component
interface ProductModalProps {
  product: Product | null;
  categories: Category[];
  subCategories: SubCategory[];
  stores: Store[];
  onSave: (product: Product) => void;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({
  product,
  categories,
  subCategories,
  stores,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<Product>({
    product_code: '',
    amazon_asin: '',
    sku_id: '',
    name: '',
    description: '',
    selling_price: 0,
    mrp: 0,
    cost_price: 0,
    quantity: 0,
    packaging_length: 0,
    packaging_breadth: 0,
    packaging_height: 0,
    packaging_weight: 0,
    gst_percentage: 0,
    image_1: '',
    image_2: '',
    image_3: '',
    image_4: '',
    image_5: '',
    image_6: '',
    image_7: '',
    image_8: '',
    image_9: '',
    image_10: '',
    video_1: '',
    video_2: '',
    size_chart: '',
    product_type: '',
    size: '',
    colour: '',
    return_exchange_condition: '',
    hsn_code: '',
    custom_attributes: '',
    is_active: true,
    is_featured: false,
    store_id: 1,
    category_id: 1,
    sub_category_id: 1
  });

  useEffect(() => {
    if (product) {
      console.log('=== EDITING PRODUCT ===');
      console.log('Product to edit:', product);
      console.log('Available categories:', categories);
      console.log('Available subcategories:', subCategories);
      console.log('Product category_id:', product.category_id);
      console.log('Product sub_category_id:', product.sub_category_id);
      
      setFormData(product);
      
      // Log the form data after setting
      setTimeout(() => {
        console.log('Form data after setting:', formData);
      }, 100);
    }
  }, [product]);

  // Reset subcategory when category changes
  useEffect(() => {
    const currentSubCategory = subCategories.find(sc => sc.id === formData.sub_category_id);
    if (currentSubCategory && currentSubCategory.category_id !== formData.category_id) {
      // Reset subcategory if it doesn't match the new category
      setFormData(prev => ({ ...prev, sub_category_id: 1 }));
    }
  }, [formData.category_id, subCategories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {product ? 'Edit Product' : 'Create New Product'}
            </h2>
            <Button variant="ghost" onClick={onClose}>✕</Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product_code">Product Code *</Label>
                    <Input
                      id="product_code"
                      value={formData.product_code}
                      onChange={(e) => handleInputChange('product_code', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="amazon_asin">Amazon ASIN</Label>
                    <Input
                      id="amazon_asin"
                      value={formData.amazon_asin}
                      onChange={(e) => handleInputChange('amazon_asin', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sku_id">SKU ID *</Label>
                    <Input
                      id="sku_id"
                      value={formData.sku_id}
                      onChange={(e) => handleInputChange('sku_id', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="product_type">Product Type</Label>
                    <Input
                      id="product_type"
                      value={formData.product_type}
                      onChange={(e) => handleInputChange('product_type', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                                      <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md h-24"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category_id">Category *</Label>
                    <select
                      id="category_id"
                      value={formData.category_id}
                      onChange={(e) => handleInputChange('category_id', Number(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="sub_category_id">Sub Category *</Label>
                    <select
                      id="sub_category_id"
                      value={formData.sub_category_id}
                      onChange={(e) => handleInputChange('sub_category_id', Number(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Select Sub Category</option>
                      {/* Show subcategories for current category */}
                      {subCategories
                        .filter(sc => sc.category_id === formData.category_id)
                        .map(subCategory => (
                          <option key={subCategory.id} value={subCategory.id}>
                            {subCategory.name}
                          </option>
                        ))}
                      {/* Show current subcategory if it exists but doesn't match current category */}
                      {formData.sub_category_id && 
                       subCategories.find(sc => sc.id === formData.sub_category_id) && 
                       subCategories.find(sc => sc.id === formData.sub_category_id)?.category_id !== formData.category_id && (
                        <optgroup label="Current Subcategory (Different Category)">
                          <option value={formData.sub_category_id}>
                            {subCategories.find(sc => sc.id === formData.sub_category_id)?.name} 
                            (Category: {categories.find(c => c.id === subCategories.find(sc => sc.id === formData.sub_category_id)?.category_id)?.name})
                          </option>
                        </optgroup>
                      )}
                    </select>
                    {/* Show warning if subcategory doesn't match category */}
                    {formData.sub_category_id && 
                     subCategories.find(sc => sc.id === formData.sub_category_id)?.category_id !== formData.category_id && (
                      <div className="text-xs text-orange-600 mt-1">
                        ⚠️ Subcategory belongs to a different category. Consider changing it.
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="store_id">Store *</Label>
                    <select
                      id="store_id"
                      value={formData.store_id}
                      onChange={(e) => handleInputChange('store_id', Number(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      {stores.map(store => (
                        <option key={store.id} value={store.id}>{store.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </TabsContent>

              {/* Pricing & Stock Tab */}
              <TabsContent value="pricing" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="selling_price">Selling Price *</Label>
                    <Input
                      id="selling_price"
                      type="number"
                      step="0.01"
                      value={formData.selling_price}
                      onChange={(e) => handleInputChange('selling_price', Number(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mrp">MRP</Label>
                    <Input
                      id="mrp"
                      type="number"
                      step="0.01"
                      value={formData.mrp}
                      onChange={(e) => handleInputChange('mrp', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost_price">Cost Price</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) => handleInputChange('cost_price', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Stock Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', Number(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gst_percentage">GST Percentage</Label>
                    <Input
                      id="gst_percentage"
                      type="number"
                      step="0.01"
                      value={formData.gst_percentage}
                      onChange={(e) => handleInputChange('gst_percentage', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="packaging_length">Length (cm)</Label>
                    <Input
                      id="packaging_length"
                      type="number"
                      step="0.1"
                      value={formData.packaging_length}
                      onChange={(e) => handleInputChange('packaging_length', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="packaging_breadth">Width (cm)</Label>
                    <Input
                      id="packaging_breadth"
                      type="number"
                      step="0.1"
                      value={formData.packaging_breadth}
                      onChange={(e) => handleInputChange('packaging_breadth', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="packaging_height">Height (cm)</Label>
                    <Input
                      id="packaging_height"
                      type="number"
                      step="0.1"
                      value={formData.packaging_height}
                      onChange={(e) => handleInputChange('packaging_height', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="packaging_weight">Weight (kg)</Label>
                    <Input
                      id="packaging_weight"
                      type="number"
                      step="0.1"
                      value={formData.packaging_weight}
                      onChange={(e) => handleInputChange('packaging_weight', Number(e.target.value))}
                    />
                  </div>
                </div>
              </TabsContent>

                             {/* Media Tab */}
               <TabsContent value="media" className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label>Product Images (Up to 10)</Label>
                     <div className="space-y-2">
                       {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                         <div key={num} className="space-y-2">
                           <div className="flex items-center space-x-2">
                             <Input
                               placeholder={`Image ${num} URL`}
                               value={formData[`image_${num}` as keyof Product] as string}
                               onChange={(e) => handleInputChange(`image_${num}` as keyof Product, e.target.value)}
                             />
                             <Button type="button" variant="outline" size="sm">
                               <Upload className="w-4 h-4" />
                             </Button>
                           </div>
                           {/* Image Preview */}
                           {formData[`image_${num}` as keyof Product] && (
                             <div className="w-20 h-20 border rounded-lg overflow-hidden">
                               <img 
                                 src={formData[`image_${num}` as keyof Product] as string}
                                 alt={`Preview ${num}`}
                                 className="w-full h-full object-cover"
                                 onError={(e) => {
                                   const target = e.target as HTMLImageElement;
                                   target.style.display = 'none';
                                   const nextSibling = target.nextSibling as HTMLElement;
                                   if (nextSibling) nextSibling.style.display = 'flex';
                                 }}
                               />
                               <div className="w-full h-full flex items-center justify-center bg-gray-100" style={{display: 'none'}}>
                                 <ImageIcon className="w-6 h-6 text-gray-400" />
                               </div>
                             </div>
                           )}
                         </div>
                       ))}
                     </div>
                   </div>
                   <div>
                     <Label>Videos & Size Chart</Label>
                     <div className="space-y-2">
                       <Input
                         placeholder="Video 1 URL"
                         value={formData.video_1}
                         onChange={(e) => handleInputChange('video_1', e.target.value)}
                       />
                       <Input
                         placeholder="Video 2 URL"
                         value={formData.video_2}
                         onChange={(e) => handleInputChange('video_2', e.target.value)}
                       />
                       <Input
                         placeholder="Size Chart URL"
                         value={formData.size_chart}
                         onChange={(e) => handleInputChange('size_chart', e.target.value)}
                       />
                     </div>
                   </div>
                 </div>
               </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="size">Size</Label>
                    <Input
                      id="size"
                      value={formData.size}
                      onChange={(e) => handleInputChange('size', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="colour">Colour</Label>
                    <Input
                      id="colour"
                      value={formData.colour}
                      onChange={(e) => handleInputChange('colour', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="hsn_code">HSN Code</Label>
                  <Input
                    id="hsn_code"
                    value={formData.hsn_code}
                    onChange={(e) => handleInputChange('hsn_code', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="return_exchange_condition">Return & Exchange Policy</Label>
                  <textarea
                    id="return_exchange_condition"
                    value={formData.return_exchange_condition}
                    onChange={(e) => handleInputChange('return_exchange_condition', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md h-20"
                  />
                </div>

                <div>
                  <Label htmlFor="custom_attributes">Custom Attributes</Label>
                  <textarea
                    id="custom_attributes"
                    value={formData.custom_attributes}
                    onChange={(e) => handleInputChange('custom_attributes', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md h-20"
                    placeholder="Enter custom attributes in JSON format or key-value pairs"
                  />
                </div>

                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={formData.is_featured}
                      onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                    />
                    <Label htmlFor="is_featured">Featured</Label>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  console.log('=== FORM DEBUG ===');
                  console.log('Current formData:', formData);
                  console.log('Available categories:', categories);
                  console.log('Available subcategories:', subCategories);
                  console.log('Selected category_id:', formData.category_id);
                  console.log('Selected sub_category_id:', formData.sub_category_id);
                  alert(`Form Debug:\nCategory: ${formData.category_id}\nSubcategory: ${formData.sub_category_id}\nCheck console for details`);
                }}
              >
                Debug Form
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {product ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// CSV Upload Modal Component
interface CsvUploadModalProps {
  onUpload: () => void;
  onClose: () => void;
  isLoading: boolean;
  progress: number;
  csvFile: File | null;
  onFileSelect: (file: File | null) => void;
  onDownloadTemplate: () => void;
}

const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  onUpload,
  onClose,
  isLoading,
  progress,
  csvFile,
  onFileSelect,
  onDownloadTemplate
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('File input change detected:', file);
    
    if (file) {
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
      
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        console.log('Valid CSV file detected, calling onFileSelect');
        onFileSelect(file);
      } else {
        console.log('Invalid file type, showing error');
        alert('Please select a valid CSV file (.csv extension)');
        onFileSelect(null);
        // Reset the file input
        e.target.value = '';
      }
    } else {
      console.log('No file selected, clearing selection');
      onFileSelect(null);
    }
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      console.log('File input reset via ref');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Bulk Upload Products</h2>
            <Button variant="ghost" onClick={onClose}>✕</Button>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="csv-file">Select CSV File</Label>
              <div className="mt-2">
                <Input
                  ref={fileInputRef}
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Maximum file size: 50MB. Supports up to 50,000 products.
              </p>
            </div>

            {csvFile && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">{csvFile.name}</span>
                  <span className="text-sm text-gray-500">
                    ({(csvFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  File selected successfully - Ready to upload
                </div>
              </div>
            )}

            {!csvFile && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-sm text-yellow-800">
                  ⚠️ No file selected. Please choose a CSV file to upload.
                </div>
              </div>
            )}

            {isLoading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">CSV Format Requirements:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Product Code, ASIN, SKU ID, Product Name (required)</li>
                <li>• Selling Price, MRP, Cost Price, Quantity (required)</li>
                <li>• Category ID, Sub Category ID, Store ID (required)</li>
                <li>• Images, Videos, Dimensions, GST, HSN Code (optional)</li>
                <li>• Download sample CSV template for reference</li>
              </ul>
            </div>

            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={onDownloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    console.log('=== DEBUG BUTTON CLICKED ===');
                    console.log('Current csvFile state:', csvFile);
                    console.log('Current isLoading state:', isLoading);
                    console.log('File input element:', document.getElementById('csv-file'));
                    alert(`File: ${csvFile ? csvFile.name : 'None'}\nSize: ${csvFile ? csvFile.size : 'N/A'} bytes\nLoading: ${isLoading}`);
                  }}
                >
                  Debug
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    console.log('=== TEST FILE SELECTION ===');
                    // Create a test file object
                    const testFile = new File(['test content'], 'test.csv', { type: 'text/csv' });
                    console.log('Test file created:', testFile);
                    onFileSelect(testFile);
                  }}
                >
                  Test File
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    console.log('=== RESET FILE SELECTION ===');
                    onFileSelect(null);
                    resetFileInput();
                  }}
                >
                  Reset
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={onUpload}
                  disabled={!csvFile || isLoading}
                  className="min-w-[100px]"
                >
                  {isLoading ? 'Processing...' : 'Upload'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
