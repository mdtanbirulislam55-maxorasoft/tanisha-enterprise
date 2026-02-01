import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  ExpandMore,
  SupportAgent,
  Email,
  Phone,
  WhatsApp,
  QuestionAnswer,
  VideoLibrary,
  Description,
  Download
} from '@mui/icons-material';

const HelpSupport = () => {
  const [faqs] = useState([
    {
      question: 'How to create a new invoice?',
      answer: 'Go to Sales > Create Sale, select customer and products, then click Generate Invoice.'
    },
    {
      question: 'How to manage inventory?',
      answer: 'Use Stock Management to add, update, or transfer stock between branches.'
    },
    {
      question: 'How to generate reports?',
      answer: 'Navigate to Reports section and select the type of report you need (Sales, Stock, Financial).'
    },
    {
      question: 'How to backup data?',
      answer: 'Go to Settings > Backup & Restore to create manual backups or schedule automatic backups.'
    },
    {
      question: 'How to add new products?',
      answer: 'Go to Products > Add Product, fill in the details including price, stock, and category.'
    }
  ]);

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleContactChange = (e) => {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Support request submitted! We will contact you soon.');
    setContactForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        <SupportAgent sx={{ mr: 1, verticalAlign: 'middle' }} />
        Help & Support Center
      </Typography>

      <Grid container spacing={3}>
        {/* FAQ Section */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom color="primary">
              <QuestionAnswer sx={{ mr: 1, verticalAlign: 'middle' }} />
              Frequently Asked Questions
            </Typography>
            
            {faqs.map((faq, index) => (
              <Accordion key={index} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography fontWeight="medium">{faq.question}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography color="text.secondary">{faq.answer}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>

          {/* Documentation */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom color="primary">
              <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
              Documentation & Guides
            </Typography>
            
            <List>
              <ListItem button component="a" href="#">
                <ListItemIcon>
                  <Download />
                </ListItemIcon>
                <ListItemText 
                  primary="User Manual PDF" 
                  secondary="Complete guide to using Tanisha ERP"
                />
              </ListItem>
              
              <ListItem button component="a" href="#">
                <ListItemIcon>
                  <VideoLibrary />
                </ListItemIcon>
                <ListItemText 
                  primary="Video Tutorials" 
                  secondary="Step-by-step video guides"
                />
              </ListItem>
              
              <ListItem button component="a" href="#">
                <ListItemIcon>
                  <Description />
                </ListItemIcon>
                <ListItemText 
                  primary="API Documentation" 
                  secondary="For developers and integrations"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Contact & Support */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom color="primary">
              <SupportAgent sx={{ mr: 1, verticalAlign: 'middle' }} />
              Contact Support
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              Our support team is available 24/7 for urgent issues.
            </Alert>

            <List>
              <ListItem>
                <ListItemIcon>
                  <Phone color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Hotline" 
                  secondary="+880 1711-XXXXXX (9 AM - 6 PM)"
                />
              </ListItem>
              
              <Divider />
              
              <ListItem>
                <ListItemIcon>
                  <WhatsApp color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="WhatsApp" 
                  secondary="+880 1711-YYYYYY"
                />
              </ListItem>
              
              <Divider />
              
              <ListItem>
                <ListItemIcon>
                  <Email color="action" />
                </ListItemIcon>
                <ListItemText 
                  primary="Email" 
                  secondary="support@tanisha-agri.com"
                />
              </ListItem>
            </List>
          </Paper>

          {/* Contact Form */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom color="primary">
              Send Message
            </Typography>
            
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Your Name"
                name="name"
                value={contactForm.name}
                onChange={handleContactChange}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={contactForm.email}
                onChange={handleContactChange}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Subject"
                name="subject"
                value={contactForm.subject}
                onChange={handleContactChange}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Message"
                name="message"
                value={contactForm.message}
                onChange={handleContactChange}
                margin="normal"
                multiline
                rows={4}
                required
              />
              
              <Box sx={{ mt: 3, textAlign: 'right' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                >
                  Send Message
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>

        {/* Quick Tips */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Tips
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Press F1 for help in any screen<br/>
                • Use Ctrl+S to save data quickly<br/>
                • Export reports to Excel for further analysis<br/>
                • Set up automatic backups for data safety
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HelpSupport;