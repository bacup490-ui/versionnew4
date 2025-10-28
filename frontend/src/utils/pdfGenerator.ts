import jsPDF from 'jspdf';
import { InternDTO } from '../services/internService';
import { ProjectDTO } from '../services/projectService';
import { TaskDTO } from '../services/taskService';

interface ReportData {
  interns: InternDTO[];
  projects: ProjectDTO[];
  tasks: TaskDTO[];
  userRole: 'ADMIN' | 'ENCADREUR' | 'STAGIAIRE';
  userName: string;
  userAvatar?: string;
}

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

export const generatePDF = async (data: ReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 30;
  const primaryColor: [number, number, number] = [249, 115, 22];
  const secondaryColor: [number, number, number] = [220, 38, 38];
  const lightColor: [number, number, number] = [254, 243, 199];

  const addText = (text: string, x: number, size: number = 12, style: 'normal' | 'bold' = 'normal', color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(text, x, yPosition);
    yPosition += size / 2 + 2;
  };

  const addBox = (x: number, y: number, width: number, height: number, fillColor: [number, number, number], borderColor?: [number, number, number]) => {
    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    if (borderColor) {
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.5);
      doc.rect(x, y, width, height, 'FD');
    } else {
      doc.rect(x, y, width, height, 'F');
    }
  };

  const addLine = (color: [number, number, number] = [230, 230, 230]) => {
    yPosition += 3;
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.3);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 5;
  };

  const checkPageBreak = (spaceNeeded: number = 20) => {
    if (yPosition + spaceNeeded > pageHeight - 20) {
      doc.addPage();
      addHeader();
      yPosition = 40;
    }
  };

  const addHeader = () => {
    addBox(0, 0, pageWidth, 25, primaryColor);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT DE GESTION', pageWidth / 2, 12, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Systeme de Gestion des Stages', pageWidth / 2, 19, { align: 'center' });
  };

  addHeader();

  if (data.userAvatar) {
    try {
      const avatar = await loadImage(data.userAvatar);
      const canvas = document.createElement('canvas');
      canvas.width = 80;
      canvas.height = 80;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.arc(40, 40, 40, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 0, 0, 80, 80);
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', pageWidth - 35, yPosition, 15, 15, '', 'FAST');
      }
    } catch (error) {
      console.log('Could not load avatar');
    }
  }

  addBox(20, yPosition, pageWidth - 40, 20, lightColor, primaryColor);
  yPosition += 7;
  addText(`Genere par: ${data.userName}`, 25, 12, 'bold', primaryColor);
  addText(`Role: ${data.userRole} | Date: ${new Date().toLocaleDateString('fr-FR')}`, 25, 9, 'normal', [100, 100, 100]);
  yPosition += 5;

  addLine(primaryColor);

  checkPageBreak(50);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(20, yPosition - 5, 4, 10, 'F');
  addText('RESUME GLOBAL', 28, 16, 'bold', primaryColor);
  yPosition += 2;

  const activeProjects = data.projects.filter(p => p.status === 'IN_PROGRESS').length;
  const completedProjects = data.projects.filter(p => p.status === 'COMPLETED').length;
  const completedTasks = data.tasks.filter(t => t.status === 'DONE').length;
  const successRate = data.projects.length > 0
    ? Math.round((completedProjects / data.projects.length) * 100)
    : 0;

  const metrics = [];
  if (data.userRole === 'ADMIN' || data.userRole === 'ENCADREUR') {
    metrics.push(`Stagiaires: ${data.interns.length}`);
  }
  metrics.push(
    `Projets actifs: ${activeProjects}`,
    `Projets termines: ${completedProjects}`,
    `Total projets: ${data.projects.length}`,
    `Taches terminees: ${completedTasks}`,
    `Total taches: ${data.tasks.length}`,
    `Taux de reussite: ${successRate}%`
  );

  const boxHeight = metrics.length * 7 + 8;
  addBox(25, yPosition, pageWidth - 50, boxHeight, [250, 250, 250], [200, 200, 200]);
  yPosition += 5;

  metrics.forEach((metric) => {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.circle(30, yPosition - 1, 1.5, 'F');
    addText(metric, 35, 10, 'normal', [60, 60, 60]);
  });

  addLine();

  if (data.userRole === 'ADMIN' || data.userRole === 'ENCADREUR') {
    checkPageBreak(50);
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.rect(20, yPosition - 5, 4, 10, 'F');
    addText('DETAILS PAR STAGIAIRE', 28, 16, 'bold', secondaryColor);
    yPosition += 3;

    data.interns.forEach((intern, index) => {
      checkPageBreak(40);

      addBox(25, yPosition - 3, pageWidth - 50, 35, [248, 250, 252], [220, 220, 220]);

      addText(`${index + 1}. ${intern.firstName} ${intern.lastName}`, 30, 12, 'bold', primaryColor);

      const internProjects = data.projects.filter(p => p.stagiaireId === intern.id);
      const internTasks = data.tasks.filter(t => t.assignedTo === intern.userId);
      const internCompletedTasks = internTasks.filter(t => t.status === 'DONE').length;
      const taskCompletion = internTasks.length > 0 ? Math.round((internCompletedTasks / internTasks.length) * 100) : 0;

      addText(`Email: ${intern.email} | Dept: ${intern.department}`, 35, 9, 'normal', [80, 80, 80]);
      addText(`Projets: ${internProjects.length} | Taches: ${internTasks.length} (${internCompletedTasks} terminees - ${taskCompletion}%)`, 35, 9, 'normal', [80, 80, 80]);

      yPosition += 5;
    });

    addLine();
  }

  checkPageBreak(50);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(20, yPosition - 5, 4, 10, 'F');
  addText('DETAILS PAR PROJET', 28, 16, 'bold', primaryColor);
  yPosition += 3;

  data.projects.forEach((project, index) => {
    checkPageBreak(45);

    const projectTasks = data.tasks.filter(t => t.projectId === project.id);
    const projectCompletedTasks = projectTasks.filter(t => t.status === 'DONE').length;

    addBox(25, yPosition - 3, pageWidth - 50, 38, [252, 248, 255], [220, 220, 220]);

    const statusLabels = {
      'PLANNING': 'Planification',
      'IN_PROGRESS': 'En cours',
      'COMPLETED': 'Termine',
      'ON_HOLD': 'En pause',
      'CANCELLED': 'Annule'
    };

    addText(`${index + 1}. ${project.title}`, 30, 12, 'bold', secondaryColor);

    const descText = project.description.substring(0, 85) + (project.description.length > 85 ? '...' : '');
    addText(descText, 35, 8, 'normal', [100, 100, 100]);

    addText(`Statut: ${statusLabels[project.status]} | Progression: ${project.progress}% | Dept: ${project.department}`, 35, 9, 'normal', [80, 80, 80]);
    addText(`Taches: ${projectTasks.length} (${projectCompletedTasks} terminees)`, 35, 9, 'normal', [80, 80, 80]);

    yPosition += 5;
  });

  addLine();
  checkPageBreak(50);
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(20, yPosition - 5, 4, 10, 'F');
  addText('STATISTIQUES DES TACHES', 28, 16, 'bold', secondaryColor);
  yPosition += 3;

  const tasksByStatus = {
    TODO: data.tasks.filter(t => t.status === 'TODO').length,
    IN_PROGRESS: data.tasks.filter(t => t.status === 'IN_PROGRESS').length,
    DONE: data.tasks.filter(t => t.status === 'DONE').length,
    BUG: data.tasks.filter(t => t.status === 'BUG').length
  };

  const tasksByPriority = {
    LOW: data.tasks.filter(t => t.priority === 'LOW').length,
    MEDIUM: data.tasks.filter(t => t.priority === 'MEDIUM').length,
    HIGH: data.tasks.filter(t => t.priority === 'HIGH').length
  };

  addBox(25, yPosition, 80, 28, [255, 247, 237], [251, 146, 60]);
  const tempY = yPosition;
  yPosition += 5;
  addText('Par statut:', 30, 11, 'bold', [0, 0, 0]);
  addText(`En attente: ${tasksByStatus.TODO}`, 32, 9);
  addText(`En cours: ${tasksByStatus.IN_PROGRESS}`, 32, 9);
  addText(`Terminees: ${tasksByStatus.DONE}`, 32, 9);
  addText(`Bugs: ${tasksByStatus.BUG}`, 32, 9);

  yPosition = tempY;
  addBox(110, yPosition, 80, 28, [240, 253, 244], [52, 211, 153]);
  yPosition += 5;
  addText('Par priorite:', 115, 11, 'bold', [0, 0, 0]);
  addText(`Basse: ${tasksByPriority.LOW}`, 117, 9);
  addText(`Moyenne: ${tasksByPriority.MEDIUM}`, 117, 9);
  addText(`Haute: ${tasksByPriority.HIGH}`, 117, 9);
  yPosition += 5;

  addLine();
  checkPageBreak(30);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(20, yPosition - 5, 4, 10, 'F');
  addText('CONCLUSION', 28, 16, 'bold', primaryColor);
  yPosition += 3;

  const taskCompletionRate = data.tasks.length > 0
    ? Math.round((completedTasks / data.tasks.length) * 100)
    : 0;

  let performance = 'Excellente';
  let perfColor: [number, number, number] = [22, 163, 74];
  if (successRate < 50) {
    performance = 'A ameliorer';
    perfColor = [220, 38, 38];
  } else if (successRate < 70) {
    performance = 'Moyenne';
    perfColor = [234, 179, 8];
  } else if (successRate < 85) {
    performance = 'Bonne';
    perfColor = [249, 115, 22];
  }

  addBox(25, yPosition - 2, pageWidth - 50, 22, [240, 249, 255], [147, 197, 253]);
  yPosition += 4;
  addText(`Taux de completion des taches: ${taskCompletionRate}%`, 30, 11, 'normal', [60, 60, 60]);
  addText(`Taux de reussite des projets: ${successRate}%`, 30, 11, 'normal', [60, 60, 60]);
  addText(`Evaluation de la performance: ${performance}`, 30, 11, 'bold', perfColor);

  yPosition += 8;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(2);
  doc.line(20, yPosition, pageWidth - 20, yPosition);

  yPosition += 5;
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text('Document genere automatiquement par le Systeme de Gestion des Stages', pageWidth / 2, yPosition, { align: 'center' });

  const fileName = `Rapport_${data.userRole}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
