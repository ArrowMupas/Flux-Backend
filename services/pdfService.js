const PdfPrinter = require('pdfmake');
const dayjs = require('dayjs');
const path = require('path');

//Fonts here
const fonts = {
  Roboto: {
    normal: path.join(__dirname, '../assets/Roboto-Regular.ttf'),
    bold: path.join(__dirname, '../assets/Roboto-Bold.ttf'),
    italics: path.join(__dirname, '../assets/Roboto-Italic.ttf'),
    bolditalics: path.join(__dirname, '../assets/Roboto-BoldItalic.ttf')
  }
};

const printer = new PdfPrinter(fonts);


const generateOrdersPDF = (orders, dateRange, reportType) => {
  return new Promise((resolve, reject) => {
    try {
      // Calculate totals
      const totalAmount = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
      const totalOrders = orders.length;

      const docDefinition = {
        content: [
          {
            columns: [
              {
                image: path.join(__dirname, '../assets/alas-logo.jpg'),
                width: 60,
                margin: [0, 0, 10, 0]
              },
              {
                stack: [
                  { text: 'Alas Delis Hot Sauce', style: 'businessName' },
                  { text: 'The Sauce That Bites Back', style: 'tagline' } // optional tagline
                ],
                alignment: 'left',
                margin: [0, 10, 0, 0]
              }
            ]
          },
          {
            text: 'Revenue Report',
            style: 'reportTitle',
            alignment: 'center',
            margin: [0, 15, 0, 10]
          },
          {
            canvas: [
              { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }
            ],
            margin: [0, 0, 0, 20]
          },

          // Report
          {
            columns: [
              {
                text: `Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`,
                style: 'subheader'
              },
              {
                text: `Generated: ${dayjs().format('MMM D, YYYY | h:mm A')}`,
                style: 'subheader',
                alignment: 'right'
              }
            ]
          },
          {
            text: `Date Range: ${dateRange}`,
            style: 'subheader',
            margin: [0, 0, 0, 20]
          },
          // Summary
          {
            text: 'Sales Summary',
            style: 'sectionHeader',
            margin: [0, 10, 0, 10]
          },
          {
            table: {
              headerRows: 1,
              widths: ['*', '*'],
              body: [
                [
                  { text: 'Total Orders', style: 'tableHeader', alignment: 'center' },
                  { text: 'Total Sales', style: 'tableHeader', alignment: 'center' }
                ],
                [
                 { text: totalOrders.toString(), alignment: 'center' },
                 { text: `₱${totalAmount.toFixed(2)}`, alignment: 'center' }
                ]
              ]
            }
          },
          // Orders table
          {
            text: 'Order Details',
            style: 'sectionHeader',
            margin: [0, 20, 0, 10]
          },
          {
            table: {
              headerRows: 1,
              widths: ['auto','*', '*', 'auto', 'auto', 'auto'],
              body: [
                [
                  { text: 'Type', style: 'tableHeader', alignment: 'center' },
                  { text: 'Order ID', style: 'tableHeader', alignment: 'center' },
                  { text: 'Customer', style: 'tableHeader', alignment: 'center' },
                  { text: 'Date', style: 'tableHeader', alignment: 'center' },
                  { text: 'Payment Method', style: 'tableHeader', alignment: 'center' },
                  { text: 'Amount', style: 'tableHeader', alignment: 'center' }
                ],
                ...orders.map(order => [
                  {text: order.type, alignment:'center'},
                  {text: order.id.toString(), alignment: 'center'},
                  {text: order.customer_name || 'N/A', alignment: 'center'},
                  dayjs(order.order_date).isValid()
                    ? dayjs(order.order_date).format('MMM D, YYYY')
                    : 'Invalid Date',
                  order.payment_method || 'N/A',
                  {
                    columns: [
                      { text: '₱', width: 10, alignment: 'left' },
                      { text: parseFloat(order.total_amount || 0).toFixed(2), alignment: 'right' }
                    ],
                    columnGap: 2
                  }
                ])
              ]
            }
          }
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true
          },
          subheader: {
            fontSize: 12,
            bold: true
          },
          sectionHeader: {
            fontSize: 14,
            bold: true,
            color: '#2c3e50'
          },
          tableHeader: {
            bold: true,
            fontSize: 10,
            color: 'white',
            fillColor: '#2c3e50'
          },
          businessName: {
            fontSize: 16,
            bold: true,
            color: '#d35400'
          },
          reportTitle: {
            fontSize: 18,
            bold: true,
            color: '#2c3e50'
          }
        },
        defaultStyle: {
          fontSize: 10
        }
      };

      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      
      const chunks = [];
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => {
        const result = Buffer.concat(chunks);
        resolve(result);
      });
      
      pdfDoc.on('error', (error) => {
        reject(error);
      });
      
      pdfDoc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateOrdersPDF
};