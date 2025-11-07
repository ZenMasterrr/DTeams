import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Initialize OAuth2 client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Set credentials for the OAuth2 client
 * In a real implementation, you would fetch these from your database
 * where they were stored after the user authorized your app
 */
export function setGoogleCredentials(accessToken: string, refreshToken?: string) {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
}

/**
 * Add a row to Google Sheets
 */
export async function addRowToSheet(
  spreadsheetId: string,
  sheetName: string,
  values: any[],
  range?: string
): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    
    // Determine the range - if not specified, append to the sheet
    const targetRange = range || `${sheetName}!A1`;
    
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: targetRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });

    return {
      success: true,
      message: `Successfully added row to sheet ${sheetName}`,
      details: {
        spreadsheetId,
        sheetName,
        updatedRange: response.data.updates?.updatedRange,
        updatedRows: response.data.updates?.updatedRows,
      },
    };
  } catch (error) {
    console.error('Error adding row to Google Sheets:', error);
    return {
      success: false,
      message: `Failed to add row to sheet: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.message : String(error) },
    };
  }
}

/**
 * Create a Google Calendar event
 */
export async function createCalendarEvent(
  eventTitle: string,
  eventDescription: string,
  startDateTime: string, // ISO 8601 format: "2024-11-15T14:30:00"
  endDateTime: string,
  sendNotifications: boolean = true
): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const event = {
      summary: eventTitle,
      description: eventDescription,
      start: {
        dateTime: startDateTime,
        timeZone: 'UTC', // You may want to make this configurable
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'UTC',
      },
      reminders: {
        useDefault: false,
        overrides: sendNotifications ? [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 },
        ] : [],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      sendNotifications: sendNotifications,
    });

    return {
      success: true,
      message: `Successfully created calendar event: ${eventTitle}`,
      details: {
        eventId: response.data.id,
        eventLink: response.data.htmlLink,
        startTime: response.data.start?.dateTime,
        endTime: response.data.end?.dateTime,
      },
    };
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return {
      success: false,
      message: `Failed to create calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.message : String(error) },
    };
  }
}

/**
 * Search Gmail for messages matching criteria
 * This can be used for the trigger
 */
export async function searchGmail(
  query: string,
  maxResults: number = 10
): Promise<{ success: boolean; messages?: any[]; error?: string }> {
  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults,
    });

    if (!response.data.messages || response.data.messages.length === 0) {
      return {
        success: true,
        messages: [],
      };
    }

    // Get full message details for each message
    const messages = await Promise.all(
      response.data.messages.map(async (msg: any) => {
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
        });
        return fullMessage.data;
      })
    );

    return {
      success: true,
      messages,
    };
  } catch (error) {
    console.error('Error searching Gmail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Helper function to parse date and time strings into ISO 8601 format
 */
export function parseDateTime(dateField: string, timeField: string): string {
  // If already in ISO format, return as is
  if (dateField.includes('T')) {
    return dateField;
  }
  
  // Parse date (handles formats like "2025-11-7" or "2025-11-07")
  const dateParts = dateField.split('-');
  if (dateParts.length !== 3) {
    throw new Error(`Invalid date format: ${dateField}. Expected format: YYYY-MM-DD or YYYY-M-D`);
  }
  
  const year = dateParts[0];
  const month = dateParts[1].padStart(2, '0');
  const day = dateParts[2].padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  
  // Parse time (handles formats like "2:15" or "14:30" or "2:15:00")
  const timeParts = timeField.split(':');
  if (timeParts.length < 2) {
    throw new Error(`Invalid time format: ${timeField}. Expected format: HH:MM or H:M`);
  }
  
  const hours = timeParts[0].padStart(2, '0');
  const minutes = timeParts[1].padStart(2, '0');
  const seconds = timeParts[2] ? timeParts[2].padStart(2, '0') : '00';
  const formattedTime = `${hours}:${minutes}:${seconds}`;
  
  // Combine date and time
  const dateTime = `${formattedDate}T${formattedTime}`;
  
  // Validate the format
  const date = new Date(dateTime);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date/time format: ${dateTime}`);
  }
  
  return dateTime;
}

/**
 * Calculate end time from start time and duration
 */
export function calculateEndTime(startDateTime: string, durationMinutes: number): string {
  // Ensure the start time has timezone info (add UTC if not present)
  let dateTimeWithTz = startDateTime;
  if (!startDateTime.includes('Z') && !startDateTime.includes('+') && !startDateTime.includes('T')) {
    // If no timezone and no 'T', it's malformed
    throw new Error(`Invalid datetime format: ${startDateTime}`);
  }
  
  // If has 'T' but no timezone, assume UTC
  if (startDateTime.includes('T') && !startDateTime.includes('Z') && !startDateTime.match(/[+-]\d{2}:\d{2}$/)) {
    dateTimeWithTz = startDateTime + 'Z';
  }
  
  const startDate = new Date(dateTimeWithTz);
  if (isNaN(startDate.getTime())) {
    throw new Error(`Invalid start date: ${startDateTime}`);
  }
  
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  return endDate.toISOString();
}
