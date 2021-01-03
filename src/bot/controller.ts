import { Telegraf } from 'telegraf';
import { FACULTIES } from './const'
import { formKeyboard } from './helpers'
import { getAllFaculties, getUserByTelegramId, updateUser, getFacultyById, createUser } from './repository'

export const bot = new Telegraf(process.env.token as string);

function init() {
  bot.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = +new Date() - +start
    const response = JSON.stringify({
      id: ctx.message?.from?.id,
      firstName: ctx.message?.from?.first_name,
      lastName: ctx.message?.from?.last_name,
      username: ctx.message?.from?.username,
      message: ctx.message?.text,
      isSticker: ctx.message?.sticker ? true : false,
      responseTime: `${ms}ms`,
    })
  })

  bot.hears([...FACULTIES], async ctx => {
    let user = await getUserByTelegramId(ctx.message?.from?.id);
    let allFaculties = await getAllFaculties();
    allFaculties.rows.map(async faculty => {
      if (faculty['name'] === ctx.message?.text) {
        if (user) {
          user.faculty = await getFacultyById(faculty['id']);
          await updateUser(user);
        };
      };
    });
  });

  bot.on('text', async (ctx) => {
    let user = await getUserByTelegramId(ctx.message?.from?.id);
    if (!user) {
      if (ctx && ctx.message && ctx.message.from) {
        user = {
          id: null,
          user_id: `${ctx.message.from.id}`,
          faculty: null,
          group: null,
        }
        await createUser(user);
      }
    }
    
    if (user && user.faculty === null) {
        ctx.reply('Выберите ваш факультет', {
        reply_markup: {
          keyboard: formKeyboard(FACULTIES, 2),
          one_time_keyboard: true,
          remove_keyboard: true,
          resize_keyboard: true,
        }
      })
    }
  })
}

const BotController = {init};
export default BotController;