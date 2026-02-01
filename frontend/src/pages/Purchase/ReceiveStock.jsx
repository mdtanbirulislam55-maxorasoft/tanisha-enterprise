import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Package, Check, Search, Truck } from 'lucide-react';

const ReceiveStock = () => {
  const [purchases, setPurchases] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [receivingItems, setReceivingItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPendingPurchases();
  }, []);

  const fetchPendingPurchases = async () => {
    try {
      setLoading(true);
      const response = await api.get('/purchases', {
        params: { status: 'ordered' }
      });
      setPurchases(response.data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveItem = (itemId, receivedQty) => {
    setReceivingItems(prev => ({
      ...prev,
      [itemId]: receivedQty
    }));
  };

  const submitReceipt = async () => {
    try {
      await api.post(`/purchases/${selectedPurchase.id}/receive`, {
        items: receivingItems,
        receivedDate: new Date().toISOString()
      });
      setSelectedPurchase(null);
      setReceivingItems({});
      fetchPendingPurchases();
    } catch (error) {
      console.error('Error receiving stock:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Receive Stock</h1>
        <div className="flex items-center gap-2 text-gray-600">
          <Truck className="w-5 h-5" />
          <span>Goods Receipt Note</span>
        </div>
      </div>

      {/* Pending Purchases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Pending Purchases</h2>
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedPurchase?.id === purchase.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => {
                    setSelectedPurchase(purchase);
                    setReceivingItems({});
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{purchase.invoiceNumber}</p>
                      <p className="text-sm text-gray-500">{purchase.supplierName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">৳{purchase.totalAmount}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(purchase.invoiceDate).toLocaleDateString('en-BD')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                      {purchase.items?.length || 0} items
                    </span>
                    <span className="text-gray-500">
                      Delivery: {new Date(purchase.deliveryDate).toLocaleDateString('en-BD')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Receiving Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Receive Items</h2>
          {selectedPurchase ? (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium">PO: {selectedPurchase.invoiceNumber}</p>
                <p className="text-sm text-gray-600">{selectedPurchase.supplierName}</p>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedPurchase.items?.map((item) => (
                  <div key={item.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-500">Code: {item.productCode}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        Ordered: {item.orderedQty}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max={item.orderedQty}
                        placeholder="Received quantity"
                        className="flex-1 px-3 py-1 border border-gray-300 rounded"
                        onChange={(e) => handleReceiveItem(item.id, parseFloat(e.target.value))}
                      />
                      <span className="text-sm text-gray-500">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={submitReceipt}
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Check className="w-4 h-4" />
                Confirm Receipt
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Select a purchase order to receive items</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiveStock;