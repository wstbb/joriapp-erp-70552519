
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// 假设这是您调用API的函数
// import { api } from './api'; 

// 模拟API调用
const fetchOrderDetails = async (orderId) => {
    // 在真实应用中，您会在这里调用您的后端API
    // const response = await api.get(`/orders/${orderId}`);
    // return response.data;

    // 这里使用为五金店定制的模拟数据代替
    return {
        id: orderId,
        order_no: 'XSDD-20240521-001',
        partner_name: '李师傅装修工程队',
        created_at: '2024-05-21T10:30:00Z',
        total_amount: 355.50,
        items: [
            { product_name: 'M6*20mm 304不锈钢外六角螺栓', sku: 'LUOS-304-M6-20', quantity: 200, unit_price: 0.50, total_price: 100.00 },
            { product_name: 'DN20 PPR 热水管 (4米)', sku: 'GUAN-PPR-DN20-RE', quantity: 10, unit_price: 18.00, total_price: 180.00 },
            { product_name: '德力西防水电工胶带 (卷)', sku: 'JIAO-DLX-FANGSHUI', quantity: 5, unit_price: 15.10, total_price: 75.50 },
        ]
    };
};


const OrderPrint = ({ orderId }) => {

    const generatePDF = async () => {
        const order = await fetchOrderDetails(orderId);
        if (!order) {
            alert('订单数据加载失败！');
            return;
        }

        // 1. 创建 jsPDF 实例
        const doc = new jsPDF();

        // 2. 设置文档标题和基础信息
        doc.setFontSize(20);
        doc.text('销售出库单', 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text(`订单号: ${order.order_no}`, 14, 40);
        doc.text(`客户名称: ${order.partner_name}`, 14, 50);
        doc.text(`开单日期: ${new Date(order.created_at).toLocaleDateString()}`, 14, 60);

        // 3. 使用 jspdf-autotable 生成商品表格
        doc.autoTable({
            startY: 70, // 表格起始的Y轴位置
            head: [['商品名称', 'SKU', '数量', '单价', '金额']],
            body: order.items.map(item => [
                item.product_name,
                item.sku,
                item.quantity,
                `¥${item.unit_price.toFixed(2)}`,
                `¥${item.total_price.toFixed(2)}`
            ]),
            theme: 'grid', // 主题 (grid, striped, plain)
            headStyles: { fillColor: [22, 160, 133] }, // 表头颜色
        });

        // 4. 在表格下方添加总计信息
        const finalY = doc.lastAutoTable.finalY; // 获取表格结束的Y轴位置
        doc.setFontSize(14);
        doc.text(`总计金额: ¥${order.total_amount.toFixed(2)}`, 14, finalY + 20);

        // 5. 预览并打印
        doc.autoPrint(); // 自动弹出打印对话框
        window.open(doc.output('bloburl'), '_blank'); // 在新窗口中打开PDF预览
    };

    return (
        <button onClick={generatePDF}>
            打印订单
        </button>
    );
};

export default OrderPrint;
