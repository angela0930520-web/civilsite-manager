export const catalog = {
  "materials": {
    "title": "材料庫存",
    "singular": "材料",
    "table": "materials",
    "fields": [
      {
        "key": "name",
        "label": "材料名稱",
        "kind": "text",
        "required": true,
        "choices": []
      },
      {
        "key": "category",
        "label": "類別",
        "kind": "text",
        "required": true,
        "choices": []
      },
      {
        "key": "spec",
        "label": "規格",
        "kind": "text",
        "required": false,
        "choices": []
      },
      {
        "key": "unit",
        "label": "單位",
        "kind": "text",
        "required": true,
        "choices": []
      },
      {
        "key": "safety",
        "label": "安全庫存",
        "kind": "quantity",
        "required": true,
        "choices": []
      },
      {
        "key": "notes",
        "label": "備註",
        "kind": "textarea",
        "required": false,
        "choices": []
      }
    ],
    "query": "SELECT * FROM inventory",
    "search": [
      "name",
      "spec",
      "notes"
    ],
    "filters": [
      "category"
    ],
    "columns": [
      "name",
      "category",
      "spec",
      "unit",
      "balance",
      "safety"
    ]
  },
  "in": {
    "title": "進貨單據",
    "singular": "進貨",
    "table": "materials_log",
    "fields": [
      {
        "key": "day",
        "label": "日期",
        "kind": "date",
        "required": true,
        "choices": []
      },
      {
        "key": "material_id",
        "label": "材料",
        "kind": "material",
        "required": true,
        "choices": []
      },
      {
        "key": "vendor_id",
        "label": "供應廠商",
        "kind": "vendor",
        "required": true,
        "choices": []
      },
      {
        "key": "qty",
        "label": "數量",
        "kind": "quantity",
        "required": true,
        "choices": []
      },
      {
        "key": "price",
        "label": "單價（新臺幣）",
        "kind": "money",
        "required": true,
        "choices": []
      },
      {
        "key": "document",
        "label": "單據編號",
        "kind": "text",
        "required": true,
        "choices": []
      },
      {
        "key": "payment",
        "label": "請款狀態",
        "kind": "select",
        "required": true,
        "choices": [
          "未請款",
          "對帳中",
          "已結清"
        ]
      }
    ],
    "query": "SELECT l.*, m.name || CASE WHEN m.spec='' THEN '' ELSE '・' || m.spec END AS material,\n m.unit, v.name AS vendor FROM materials_log l JOIN materials m ON m.id=l.material_id\n LEFT JOIN vendors v ON v.id=l.vendor_id WHERE l.kind='in'",
    "search": [
      "material",
      "vendor",
      "document"
    ],
    "filters": [
      "material_id",
      "vendor_id",
      "from_day",
      "to_day",
      "payment"
    ],
    "columns": [
      "day",
      "document",
      "material",
      "vendor",
      "qty",
      "price",
      "total",
      "payment"
    ]
  },
  "out": {
    "title": "領料紀錄",
    "singular": "領料",
    "table": "materials_log",
    "fields": [
      {
        "key": "day",
        "label": "日期",
        "kind": "date",
        "required": true,
        "choices": []
      },
      {
        "key": "material_id",
        "label": "材料",
        "kind": "material",
        "required": true,
        "choices": []
      },
      {
        "key": "qty",
        "label": "數量",
        "kind": "quantity",
        "required": true,
        "choices": []
      },
      {
        "key": "recipient",
        "label": "領用人",
        "kind": "text",
        "required": true,
        "choices": []
      },
      {
        "key": "purpose",
        "label": "用途",
        "kind": "text",
        "required": true,
        "choices": []
      }
    ],
    "query": "SELECT l.*, m.name || CASE WHEN m.spec='' THEN '' ELSE '・' || m.spec END AS material,\n m.unit, v.name AS vendor FROM materials_log l JOIN materials m ON m.id=l.material_id\n LEFT JOIN vendors v ON v.id=l.vendor_id WHERE l.kind='out'",
    "search": [
      "material",
      "recipient",
      "purpose"
    ],
    "filters": [
      "material_id",
      "from_day",
      "to_day"
    ],
    "columns": [
      "day",
      "material",
      "qty",
      "recipient",
      "purpose"
    ]
  },
  "vendors": {
    "title": "協力廠商",
    "singular": "廠商",
    "table": "vendors",
    "fields": [
      {
        "key": "name",
        "label": "廠商名稱",
        "kind": "text",
        "required": true,
        "choices": []
      },
      {
        "key": "tax_id",
        "label": "統一編號",
        "kind": "tax",
        "required": false,
        "choices": []
      },
      {
        "key": "trade",
        "label": "工種分類",
        "kind": "text",
        "required": true,
        "choices": []
      },
      {
        "key": "contact",
        "label": "聯絡人",
        "kind": "text",
        "required": false,
        "choices": []
      },
      {
        "key": "phone",
        "label": "電話",
        "kind": "tel",
        "required": false,
        "choices": []
      },
      {
        "key": "address",
        "label": "地址",
        "kind": "text",
        "required": false,
        "choices": []
      },
      {
        "key": "rating",
        "label": "配合評價",
        "kind": "select",
        "required": false,
        "choices": [
          1,
          2,
          3,
          4,
          5
        ]
      },
      {
        "key": "notes",
        "label": "備註",
        "kind": "textarea",
        "required": false,
        "choices": []
      }
    ],
    "query": "SELECT * FROM vendors",
    "search": [
      "name",
      "tax_id",
      "contact",
      "phone",
      "address"
    ],
    "filters": [
      "trade",
      "rating"
    ],
    "columns": [
      "name",
      "tax_id",
      "trade",
      "contact",
      "phone",
      "rating"
    ]
  },
  "petty_cash": {
    "title": "零用金",
    "singular": "支出",
    "table": "petty_cash",
    "fields": [
      {
        "key": "day",
        "label": "日期",
        "kind": "date",
        "required": true,
        "choices": []
      },
      {
        "key": "category",
        "label": "支出類別",
        "kind": "text",
        "required": true,
        "choices": []
      },
      {
        "key": "purpose",
        "label": "用途",
        "kind": "text",
        "required": true,
        "choices": []
      },
      {
        "key": "amount",
        "label": "金額（新臺幣）",
        "kind": "money",
        "required": true,
        "choices": []
      },
      {
        "key": "handler",
        "label": "經手人",
        "kind": "text",
        "required": true,
        "choices": []
      },
      {
        "key": "notes",
        "label": "備註",
        "kind": "textarea",
        "required": false,
        "choices": []
      }
    ],
    "query": "SELECT * FROM petty_cash",
    "search": [
      "category",
      "purpose",
      "handler"
    ],
    "filters": [
      "month",
      "category"
    ],
    "columns": [
      "day",
      "category",
      "purpose",
      "amount",
      "handler"
    ]
  },
  "equipment": {
    "title": "機具台帳",
    "singular": "機具",
    "table": "equipment",
    "fields": [
      {
        "key": "name",
        "label": "機具名稱",
        "kind": "text",
        "required": true,
        "choices": []
      },
      {
        "key": "code",
        "label": "機具編號",
        "kind": "text",
        "required": true,
        "choices": []
      },
      {
        "key": "status",
        "label": "狀態",
        "kind": "select",
        "required": true,
        "choices": [
          "可借用",
          "維修中"
        ]
      },
      {
        "key": "notes",
        "label": "備註",
        "kind": "textarea",
        "required": false,
        "choices": []
      }
    ],
    "query": "SELECT e.*, CASE WHEN EXISTS(SELECT 1 FROM equipment_loans l WHERE l.equipment_id=e.id\n           AND l.returned IS NULL) THEN '已借出' ELSE e.status END AS state FROM equipment e",
    "search": [
      "name",
      "code"
    ],
    "filters": [
      "state"
    ],
    "columns": [
      "code",
      "name",
      "state",
      "notes"
    ]
  },
  "equipment_loans": {
    "title": "機具借還",
    "singular": "借用紀錄",
    "table": "equipment_loans",
    "fields": [
      {
        "key": "equipment_id",
        "label": "機具",
        "kind": "tool",
        "required": true,
        "choices": []
      },
      {
        "key": "borrower",
        "label": "借用人",
        "kind": "text",
        "required": true,
        "choices": []
      },
      {
        "key": "start_day",
        "label": "借出日期",
        "kind": "date",
        "required": true,
        "choices": []
      },
      {
        "key": "due_day",
        "label": "預計歸還日期",
        "kind": "date",
        "required": true,
        "choices": []
      },
      {
        "key": "returned",
        "label": "實際歸還日期",
        "kind": "date",
        "required": false,
        "choices": []
      }
    ],
    "query": "SELECT l.*, e.name || '・' || e.code AS tool FROM equipment_loans l\n           JOIN equipment e ON e.id=l.equipment_id",
    "search": [
      "tool",
      "borrower"
    ],
    "filters": [
      "equipment_id",
      "loan_state"
    ],
    "columns": [
      "tool",
      "borrower",
      "start_day",
      "due_day",
      "returned",
      "loan_state"
    ]
  }
};
export const labels = {
  "name": "機具名稱",
  "category": "類別",
  "spec": "規格",
  "unit": "單位",
  "safety": "安全庫存",
  "notes": "備註",
  "day": "日期",
  "material_id": "材料",
  "vendor_id": "供應廠商",
  "qty": "數量",
  "price": "單價（新臺幣）",
  "document": "單據編號",
  "payment": "請款狀態",
  "recipient": "領用人",
  "purpose": "用途",
  "tax_id": "統一編號",
  "trade": "工種分類",
  "contact": "聯絡人",
  "phone": "電話",
  "address": "地址",
  "rating": "配合評價",
  "amount": "金額（新臺幣）",
  "handler": "經手人",
  "code": "機具編號",
  "status": "狀態",
  "equipment_id": "機具",
  "borrower": "借用人",
  "start_day": "借出日期",
  "due_day": "預計歸還日期",
  "returned": "實際歸還日期",
  "material": "材料",
  "vendor": "供應廠商",
  "balance": "現有庫存",
  "total": "金額",
  "state": "狀態",
  "tool": "機具",
  "loan_state": "借還狀態",
  "from_day": "起始日期",
  "to_day": "結束日期",
  "month": "月份"
};
