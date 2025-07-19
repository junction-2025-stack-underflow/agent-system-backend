import { Response } from "express";
import PDFDocument from "pdfkit";
import House from "../models/House";
import { CACHE_TTL, cacheOrQuery } from "../utils/cache";
import { logError } from "../utils/logger";
import { AuthRequest } from "../types/express";

export const generateQuotePDF = async (req: AuthRequest, res: Response) => {
  const { id: houseId } = req.params;
  const agencyId = req.agencyId;

  try {
    const cacheKey = `house:${agencyId}:${houseId}`;
    const { data: house } = await cacheOrQuery(
      cacheKey,
      async () => {
        const house = await House.findOne({ "details.ID": parseInt(houseId, 10) }).lean();
        if (!house) throw new Error("House not found");
        if (house.agencyId.toString() !== agencyId) throw new Error("Unauthorized access");
        return house;
      },
      CACHE_TTL
    );

    const doc = new PDFDocument({ margin: 50 });
    const filename = `quote-house-${house.details.ID}.pdf`;
    
    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${filename}`,
    });

    doc.pipe(res);

    
    doc.rect(0, 0, doc.page.width, 80).fill('#f8f9fa');
    doc.fillColor('#333333')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text("PROPERTY QUOTE", 50, 25);
    doc.fillColor('#000000');
    let yPosition = 120;

    
    doc.rect(50, yPosition, doc.page.width - 100, 80)
       .fill('#f8f9fa')
       .stroke('#e9ecef');
    
    doc.fillColor('#333333')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text(`Quote #${house.details.ID}`, 70, yPosition + 15);
    
    doc.fontSize(11)
       .font('Helvetica')
       .text(`Issue Date: ${new Date().toLocaleDateString('en-GB')}`, 70, yPosition + 40)
       .text(`Valid Until: ${new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-GB')}`, 70, yPosition + 55);

    yPosition += 110;

    
    doc.fillColor('#333333')
       .fontSize(18)
       .font('Helvetica-Bold')
       .text("PROPERTY DETAILS", 50, yPosition);
    
    yPosition += 30;

    
    doc.rect(50, yPosition, doc.page.width - 100, 35)
       .fill('#f1f3f4')
       .stroke('#dee2e6');
    doc.fillColor('#333333')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text(house.titre, 65, yPosition + 10);

    yPosition += 50;

    
    const leftColumn = 80;
    const rightColumn = 320;
    doc.fillColor('#000000').fontSize(11).font('Helvetica');

    
    doc.text("Property Type:", leftColumn, yPosition, { continued: true, width: 120 })
       .font('Helvetica-Bold')
       .text(` ${house.details.PropertyType}`, { continued: false });
    
    yPosition += 20;
    doc.font('Helvetica')
       .text("Rooms:", leftColumn, yPosition, { continued: true, width: 80 })
       .font('Helvetica-Bold')
       .text(` ${house.details.Rooms}`, { continued: false });
    
    yPosition += 20;
    doc.font('Helvetica')
       .text("Bedrooms:", leftColumn, yPosition, { continued: true, width: 80 })
       .font('Helvetica-Bold')
       .text(` ${house.nombreLits}`, { continued: false });

    
    yPosition -= 40;
    doc.font('Helvetica')
       .text("Bathrooms:", rightColumn, yPosition, { continued: true, width: 80 })
       .font('Helvetica-Bold')
       .text(` ${house.nombreSallesDeBain}`, { continued: false });
    
    yPosition += 20;
    doc.font('Helvetica')
       .text("Kitchens:", rightColumn, yPosition, { continued: true, width: 80 })
       .font('Helvetica-Bold')
       .text(` ${house.nombreCuisine}`, { continued: false });
    
    yPosition += 20;
    doc.font('Helvetica')
       .text("Area:", rightColumn, yPosition, { continued: true, width: 80 })
       .font('Helvetica-Bold')
       .text(` ${house.details.Area} m²`, { continued: false });

    yPosition += 40;

    
    doc.fillColor('#666666')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text("LOCATION", leftColumn, yPosition);
    
    yPosition += 20;
    doc.fillColor('#333333')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text(house.region, leftColumn, yPosition);

    yPosition += 40;

    
    doc.fillColor('#666666')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text("DESCRIPTION",leftColumn, yPosition);
    
    yPosition += 25;
    doc.fillColor('#000000')
       .fontSize(10)
       .font('Helvetica')
       .text(house.description, leftColumn, yPosition);

    yPosition += 80;

    
    const price = house.details.Price.toLocaleString("fr-DZ");
    doc.rect(50, yPosition, doc.page.width - 100, 60)
       .fill('#f8f9fa')
       .stroke('#dee2e6');
    
    doc.fillColor('#333333')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text(`TOTAL: ${price} DZD`, 0, yPosition + 20, { 
         align: 'center',
         width: doc.page.width 
       });

    yPosition += 80;

    
    doc.rect(0, doc.page.height - 100, doc.page.width, 100)
       .fill('#f1f3f4');
    
    doc.fillColor('#333333')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text("HOUSEEK", 50, doc.page.height - 80);
    
    doc.fontSize(10)
       .font('Helvetica')
       .text("Professional Real Estate Services", 50, doc.page.height - 60)
       .text("houseek@gmail.com", 50, doc.page.height - 45)
       .text("www.houseek.com", 50, doc.page.height - 30);

    
    doc.text("Thank you for choosing Houseek!", {
      width: 150,
      align: 'right'
    });

    
    doc.fillColor('#000000', 0.03)
       .fontSize(60)
       .font('Helvetica-Bold')
       .text("HOUSEEK", 0, 300, {
         align: 'center',
         width: doc.page.width,
       });

    doc.end();
  } catch (err: any) {
    logError("Failed to generate PDF", { error: err, houseId, agencyId });
    const status = err.message === "House not found" ? 404 : err.message === "Unauthorized access" ? 403 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};