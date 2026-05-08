import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('AI — الذكاء الاصطناعي والدردشة')
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('summarize')
  @RequirePermissions('ai.summarize')
  summarize(@Body() body: { text: string }) {
    return this.ai.summarize(body.text);
  }

  @Post('classify')
  @RequirePermissions('ai.use')
  classify(@Body() body: { text: string }) {
    return this.ai.classify(body.text);
  }

  @Post('suggest-kpis')
  @RequirePermissions('ai.analyze')
  suggestKpis(@Body() body: { unitNameAr: string }) {
    return this.ai.suggestKpis(body.unitNameAr);
  }

  @Get('analyze-performance')
  @RequirePermissions('ai.analyze')
  analyze() {
    return this.ai.analyzePerformance();
  }

  @Post('user-story')
  @RequirePermissions('ai.use')
  userStory(@Body() body: { role: string; feature: string }) {
    return this.ai.generateUserStory(body.role, body.feature);
  }

  // ── Chatbot
  @Post('chat')
  @RequirePermissions('chatbot.use')
  chat(@CurrentUser() user: RequestUser, @Body() body: { conversationId?: string; message: string }) {
    return this.ai.chat(user.userId, body.conversationId ?? null, body.message);
  }

  @Get('conversations')
  @RequirePermissions('chatbot.use')
  listConv(@CurrentUser() user: RequestUser) {
    return this.ai.listConversations(user.userId);
  }

  @Get('conversations/:id')
  @RequirePermissions('chatbot.use')
  getConv(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ai.getConversation(id, user.userId);
  }
}
